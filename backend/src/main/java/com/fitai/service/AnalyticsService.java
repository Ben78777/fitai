package com.fitai.service;

import com.fitai.dto.response.AnalyticsResponse;
import com.fitai.dto.response.PredictResponse;
import com.fitai.model.UserProfile;
import com.fitai.model.WeightLog;
import com.fitai.repository.MealEntryRepository;
import com.fitai.repository.UserProfileRepository;
import com.fitai.repository.WeightLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    private final MealEntryRepository mealEntryRepository;
    private final WeightLogRepository weightLogRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProgressService progressService; // reuse TDEE / goal-offset logic

    public AnalyticsService(MealEntryRepository mealEntryRepository,
                            WeightLogRepository weightLogRepository,
                            UserProfileRepository userProfileRepository,
                            ProgressService progressService) {
        this.mealEntryRepository = mealEntryRepository;
        this.weightLogRepository = weightLogRepository;
        this.userProfileRepository = userProfileRepository;
        this.progressService = progressService;
    }

    /**
     * Returns per-day calorie/macro totals + weight logs for the requested window.
     *
     * @param days number of trailing days; 0 means all time
     */
    public AnalyticsResponse getAnalytics(String userId, int days) {
        UserProfile profile = requireProfile(userId);

        // 1. Fetch per-day meal aggregates
        List<Object[]> rows = days > 0
                ? mealEntryRepository.aggregateByDateSince(userId, LocalDate.now().minusDays(days - 1L))
                : mealEntryRepository.aggregateAllByDate(userId);

        List<AnalyticsResponse.DailyEntry> dailyEntries = new ArrayList<>();
        BigDecimal totalCalories = BigDecimal.ZERO;

        for (Object[] row : rows) {
            LocalDate date      = (LocalDate)   row[0];
            BigDecimal calories = nullSafe((BigDecimal) row[1]);
            BigDecimal protein  = nullSafe((BigDecimal) row[2]);
            BigDecimal carbs    = nullSafe((BigDecimal) row[3]);
            BigDecimal fat      = nullSafe((BigDecimal) row[4]);

            dailyEntries.add(new AnalyticsResponse.DailyEntry(date, calories, protein, carbs, fat));
            totalCalories = totalCalories.add(calories);
        }

        BigDecimal avgCalories = dailyEntries.isEmpty()
                ? BigDecimal.ZERO
                : totalCalories.divide(BigDecimal.valueOf(dailyEntries.size()), 0, RoundingMode.HALF_UP);

        // 2. Fetch weight logs — wrapped defensively: if the weight_logs table hasn't been
        //    created yet (migration pending), return empty list so calorie/macro charts
        //    still work rather than failing the whole response.
        List<AnalyticsResponse.WeightEntry> weightEntries = new ArrayList<>();
        try {
            List<WeightLog> weightLogs = days > 0
                    ? weightLogRepository.findByUserIdAndLoggedAtGreaterThanEqualOrderByLoggedAtAsc(
                            userId, LocalDate.now().minusDays(days - 1L))
                    : weightLogRepository.findByUserIdOrderByLoggedAtAsc(userId);
            weightEntries = weightLogs.stream()
                    .map(w -> new AnalyticsResponse.WeightEntry(w.getLoggedAt(), w.getWeightKg()))
                    .toList();
        } catch (Exception e) {
            // Most likely cause: weight_logs table not yet created in the database.
            // Log a warning so it's visible in Render logs, but don't crash the response.
            log.warn("Could not fetch weight logs (run the weight_logs migration if missing): {}", e.getMessage());
        }

        // 3. Calorie target (TDEE adjusted for goal)
        int tdee        = progressService.computeTdee(profile);
        int dailyTarget = progressService.applyGoalOffset(tdee, profile.getGoal(), profile.getCalorieTargetOffset());

        AnalyticsResponse response = new AnalyticsResponse();
        response.setDailyCalories(dailyEntries);
        response.setWeightLogs(weightEntries);
        response.setAverageCalories(avgCalories);
        response.setCalorieTarget(BigDecimal.valueOf(dailyTarget));
        return response;
    }

    /**
     * Builds a weight prediction based on logged calorie deficit/surplus history.
     *
     * Algorithm:
     *  1. averageDailyDeficit = (targetCalories × daysLogged − totalCaloriesEaten) / daysLogged
     *     Positive value = deficit (losing weight); negative = surplus (gaining).
     *  2. changePerDay = averageDailyDeficit / 7700  (1 kg fat ≈ 7700 kcal)
     *  3. Project forward for projectionDays starting from today.
     *  4. Merge actual weight logs with projected trend.
     */
    public PredictResponse predict(String userId, int projectionDays) {
        UserProfile profile = requireProfile(userId);

        int tdee = progressService.computeTdee(profile);
        // Prediction uses TDEE (what you burn) as the base — same reason as ProgressService.
        // The calorie target is your plan; TDEE is the thermodynamic reality.

        BigDecimal rawTotal = mealEntryRepository.sumAllCaloriesByUserId(userId);
        double totalCaloriesEaten = rawTotal != null ? rawTotal.doubleValue() : 0.0;
        long daysLogged = mealEntryRepository.countDistinctDatesWithEntries(userId);

        // Average daily deficit (positive = eating less than TDEE = losing weight)
        double avgDailyDeficit = daysLogged > 0
                ? (((double) tdee * daysLogged) - totalCaloriesEaten) / daysLogged
                : 0.0;

        // A positive deficit (eating less than target) means weight goes DOWN,
        // so negate: changePerDay < 0 = weight loss, > 0 = weight gain
        double changePerDay = -avgDailyDeficit / 7700.0;

        BigDecimal currentWeight = profile.getWeightKg();
        double current = currentWeight.doubleValue();

        // Build a map of actual weight log dates for easy lookup.
        // Wrapped defensively: if the weight_logs table doesn't exist yet, fall back
        // to an empty map so the projection still renders without actual data points.
        Map<LocalDate, BigDecimal> actualByDate = new HashMap<>();
        try {
            List<WeightLog> allLogs = weightLogRepository.findByUserIdOrderByLoggedAtAsc(userId);
            for (WeightLog wl : allLogs) {
                actualByDate.put(wl.getLoggedAt(), wl.getWeightKg());
            }
        } catch (Exception e) {
            log.warn("Could not fetch weight logs for prediction (run the weight_logs migration if missing): {}", e.getMessage());
        }

        // Projection starts from today, goes forward projectionDays
        List<PredictResponse.ProjectionPoint> points = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 0; i <= projectionDays; i++) {
            LocalDate date = today.plusDays(i);
            double predictedWeight = current + (changePerDay * i);
            BigDecimal predicted = BigDecimal.valueOf(predictedWeight).setScale(2, RoundingMode.HALF_UP);
            BigDecimal actual    = actualByDate.get(date); // null for future dates
            points.add(new PredictResponse.ProjectionPoint(date, actual, predicted));
        }

        double totalChange    = changePerDay * projectionDays;
        BigDecimal changeKg   = BigDecimal.valueOf(totalChange).setScale(2, RoundingMode.HALF_UP);
        BigDecimal predicted  = BigDecimal.valueOf(current + totalChange).setScale(2, RoundingMode.HALF_UP);

        PredictResponse response = new PredictResponse();
        response.setCurrentWeight(currentWeight);
        response.setPredictedWeight(predicted);
        response.setEstimatedChangeKg(changeKg);
        response.setAverageDailyDeficit(BigDecimal.valueOf(avgDailyDeficit).setScale(1, RoundingMode.HALF_UP));
        response.setProjectionDays(projectionDays);
        response.setProjectionPoints(points);
        return response;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserProfile requireProfile(String userId) {
        return userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
