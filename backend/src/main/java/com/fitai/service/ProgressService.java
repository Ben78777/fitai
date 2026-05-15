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

        int dailyTarget = computeDailyTarget(profile);

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
                profile.getCalorieTargetOffset());
    }

    // ── Mifflin-St Jeor TDEE = BMR × activity multiplier + goal offset ────────

    private int computeDailyTarget(UserProfile profile) {
        double weight = profile.getWeightKg().doubleValue();
        double height = profile.getHeightCm().doubleValue();
        int    age    = profile.getAge();

        // BMR — constant differs by gender
        double bmr = (10.0 * weight) + (6.25 * height) - (5.0 * age);
        bmr += "male".equalsIgnoreCase(profile.getGender()) ? 5 : -161;

        // Apply Harris-Benedict activity multiplier to get TDEE
        double tdee = bmr * activityMultiplier(profile.getActivityLevel());
        int tdeeRounded = (int) Math.round(tdee);

        int offset = profile.getCalorieTargetOffset();
        return switch (profile.getGoal()) {
            case "cutting"  -> tdeeRounded - offset;
            case "bulking"  -> tdeeRounded + offset;
            default         -> tdeeRounded; // maintenance — no offset
        };
    }

    private double activityMultiplier(String activityLevel) {
        if (activityLevel == null) return 1.2; // guard for legacy profiles without this field
        return switch (activityLevel) {
            case "lightly_active"    -> 1.375;
            case "moderately_active" -> 1.55;
            case "very_active"       -> 1.725;
            case "extremely_active"  -> 1.9;
            default                  -> 1.2; // sedentary
        };
    }
}
