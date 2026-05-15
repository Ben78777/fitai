package com.fitai.service;

import com.fitai.dto.response.ProgressResponse;
import com.fitai.model.UserProfile;
import com.fitai.repository.MealEntryRepository;
import com.fitai.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class ProgressService {

    private final UserProfileRepository profileRepository;
    private final MealEntryRepository mealEntryRepository;

    public ProgressService(UserProfileRepository profileRepository,
                           MealEntryRepository mealEntryRepository) {
        this.profileRepository = profileRepository;
        this.mealEntryRepository = mealEntryRepository;
    }

    public ProgressResponse getProgress(String userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

        int tdee        = computeTdee(profile);
        int dailyTarget = applyGoalOffset(tdee, profile.getGoal(), profile.getCalorieTargetOffset());

        // Today's intake (null when no entries exist yet)
        BigDecimal rawToday = mealEntryRepository.sumCaloriesForDay(userId, LocalDate.now());
        int todayCalories = rawToday != null ? (int) Math.round(rawToday.doubleValue()) : 0;
        int todaySurplusDeficit = todayCalories - dailyTarget;

        // All-time accumulated surplus/deficit:
        //   accumulated = totalCaloriesEver - (dailyTarget × numberOfDaysWithEntries)
        BigDecimal rawTotal = mealEntryRepository.sumAllCaloriesByUserId(userId);
        double totalCalories = rawTotal != null ? rawTotal.doubleValue() : 0.0;
        long daysWithEntries = mealEntryRepository.countDistinctDatesWithEntries(userId);
        double accumulated = totalCalories - ((double) dailyTarget * daysWithEntries);
        int accumulatedRounded = (int) Math.round(accumulated);

        // 1 kg of body fat ≈ 7700 kcal; round to 2 decimal places
        double estimatedWeightChange = Math.round((accumulated / 7700.0) * 100.0) / 100.0;

        return new ProgressResponse(
                dailyTarget,
                todayCalories,
                todaySurplusDeficit,
                accumulatedRounded,
                estimatedWeightChange,
                profile.getGoal(),
                profile.getCalorieTargetOffset(),
                tdee,
                profile.getWeightKg().doubleValue());
    }

    // ── TDEE calculation (Mifflin-St Jeor × Harris-Benedict multiplier) ───────

    /** Package-visible so ChatService can reuse it without duplicating logic. */
    int computeTdee(UserProfile profile) {
        double weight = profile.getWeightKg().doubleValue();
        double height = profile.getHeightCm().doubleValue();
        int    age    = profile.getAge();

        double bmr = (10.0 * weight) + (6.25 * height) - (5.0 * age);
        bmr += "male".equalsIgnoreCase(profile.getGender()) ? 5 : -161;

        return (int) Math.round(bmr * activityMultiplier(profile.getActivityLevel()));
    }

    int applyGoalOffset(int tdee, String goal, int offset) {
        return switch (goal) {
            case "cutting"  -> tdee - offset;
            case "bulking"  -> tdee + offset;
            default         -> tdee; // maintenance
        };
    }

    private double activityMultiplier(String activityLevel) {
        if (activityLevel == null) return 1.2;
        return switch (activityLevel) {
            case "lightly_active"    -> 1.375;
            case "moderately_active" -> 1.55;
            case "very_active"       -> 1.725;
            case "extremely_active"  -> 1.9;
            default                  -> 1.2; // sedentary
        };
    }
}
