package com.fitai.service;

import com.fitai.dto.response.ProgressResponse;
import com.fitai.model.UserProfile;
import com.fitai.repository.MealEntryRepository;
import com.fitai.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgressServiceTest {

    @Mock private UserProfileRepository profileRepository;
    @Mock private MealEntryRepository   mealEntryRepository;

    @InjectMocks
    private ProgressService service;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserProfile profile(String userId, String gender, int age,
                                double weightKg, double heightCm,
                                String goal, String activityLevel, int offset) {
        UserProfile p = new UserProfile();
        p.setUserId(userId);
        p.setName("Test");
        p.setGender(gender);
        p.setAge(age);
        p.setWeightKg(BigDecimal.valueOf(weightKg));
        p.setHeightCm(BigDecimal.valueOf(heightCm));
        p.setGoal(goal);
        p.setActivityLevel(activityLevel);
        p.setCalorieTargetOffset(offset);
        return p;
    }

    private void stubEntries(String userId, double todayKcal, double totalKcal, long days) {
        when(mealEntryRepository.sumCaloriesForDay(eq(userId), any(LocalDate.class)))
                .thenReturn(BigDecimal.valueOf(todayKcal));
        when(mealEntryRepository.sumAllCaloriesByUserId(userId))
                .thenReturn(BigDecimal.valueOf(totalKcal));
        when(mealEntryRepository.countDistinctDatesWithEntries(userId))
                .thenReturn(days);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    void cuttingGoal_female_sedentary_calculatesTdeeCorrectly() {
        // Female, 28y, 62.5 kg, 168 cm, sedentary, offset 500
        // BMR  = (10×62.5) + (6.25×168) − (5×28) − 161 = 625 + 1050 − 140 − 161 = 1374
        // TDEE = 1374 × 1.2 = 1648.8 → 1649
        // dailyTarget = 1649 − 500 = 1149
        // todayCalories = 1000 → surplus/deficit vs TDEE = 1000 − 1649 = −649
        // accumulated   = 3000 − (1649 × 3) = 3000 − 4947 = −1947
        // weightChange  = Math.round(−1947/7700 × 100) / 100 = Math.round(−25.28) / 100 = −0.25

        when(profileRepository.findByUserId("u1"))
                .thenReturn(Optional.of(profile("u1", "female", 28, 62.5, 168.0, "cutting", "sedentary", 500)));
        stubEntries("u1", 1000, 3000, 3);

        ProgressResponse r = service.getProgress("u1", LocalDate.of(2026, 5, 10));

        assertThat(r.getDailyCalorieTarget()).isEqualTo(1149);
        assertThat(r.getTodayCalories()).isEqualTo(1000);
        assertThat(r.getTodaySurplusDeficit()).isEqualTo(-649);   // vs TDEE, not dailyTarget
        assertThat(r.getAccumulatedSurplusDeficit()).isEqualTo(-1947);
        assertThat(r.getEstimatedWeightChangeKg()).isEqualTo(-0.25);
        assertThat(r.getGoal()).isEqualTo("cutting");
        assertThat(r.getCalorieTargetOffset()).isEqualTo(500);
        // TDEE = BMR × 1.2 = 1374 × 1.2 = 1648.8 → 1649
        assertThat(r.getTdee()).isEqualTo(1649);
        assertThat(r.getWeightKg()).isEqualTo(62.5);
    }

    @Test
    void bulkingGoal_male_moderatelyActive_calculatesTdeeCorrectly() {
        // Male, 30y, 80 kg, 180 cm, moderately_active, offset 300
        // BMR  = (10×80) + (6.25×180) − (5×30) + 5 = 800 + 1125 − 150 + 5 = 1780
        // TDEE = 1780 × 1.55 = 2759.0 → 2759
        // dailyTarget = 2759 + 300 = 3059
        // todayCalories = 3500 → surplus vs TDEE = 3500 − 2759 = 741
        // accumulated   = 7000 − (2759 × 2) = 7000 − 5518 = 1482
        // weightChange  = Math.round(1482/7700 × 100) / 100 = Math.round(19.25) / 100 = 0.19

        when(profileRepository.findByUserId("u2"))
                .thenReturn(Optional.of(profile("u2", "male", 30, 80.0, 180.0, "bulking", "moderately_active", 300)));
        stubEntries("u2", 3500, 7000, 2);

        ProgressResponse r = service.getProgress("u2", LocalDate.of(2026, 5, 10));

        assertThat(r.getDailyCalorieTarget()).isEqualTo(3059);
        assertThat(r.getTodayCalories()).isEqualTo(3500);
        assertThat(r.getTodaySurplusDeficit()).isEqualTo(741);    // vs TDEE, not dailyTarget
        assertThat(r.getAccumulatedSurplusDeficit()).isEqualTo(1482);
        assertThat(r.getEstimatedWeightChangeKg()).isEqualTo(0.19);
        assertThat(r.getGoal()).isEqualTo("bulking");
    }

    @Test
    void maintenanceGoal_lightlyActive_appliesNoOffset() {
        // Male, 30y, 80 kg, 180 cm, lightly_active
        // BMR  = 1780
        // TDEE = 1780 × 1.375 = 2447.5 → 2448
        // dailyTarget = 2448 (maintenance, no offset applied)
        // todayCalories = 2500 → surplus = 52

        when(profileRepository.findByUserId("u3"))
                .thenReturn(Optional.of(profile("u3", "male", 30, 80.0, 180.0, "maintenance", "lightly_active", 500)));
        stubEntries("u3", 2500, 2500, 1);

        ProgressResponse r = service.getProgress("u3", LocalDate.of(2026, 5, 10));

        assertThat(r.getDailyCalorieTarget()).isEqualTo(2448);
        assertThat(r.getTodaySurplusDeficit()).isEqualTo(52);
        assertThat(r.getGoal()).isEqualTo("maintenance");
    }

    @Test
    void noEntries_returnsZeroCaloriesAndAccumulated() {
        when(profileRepository.findByUserId("u4"))
                .thenReturn(Optional.of(profile("u4", "female", 25, 60.0, 165.0, "cutting", "sedentary", 300)));
        // Repository returns null when no rows exist for this user
        when(mealEntryRepository.sumCaloriesForDay(eq("u4"), any(LocalDate.class))).thenReturn(null);
        when(mealEntryRepository.sumAllCaloriesByUserId("u4")).thenReturn(null);
        when(mealEntryRepository.countDistinctDatesWithEntries("u4")).thenReturn(0L);

        ProgressResponse r = service.getProgress("u4", LocalDate.of(2026, 5, 10));

        assertThat(r.getTodayCalories()).isEqualTo(0);
        assertThat(r.getAccumulatedSurplusDeficit()).isEqualTo(0);
        assertThat(r.getEstimatedWeightChangeKg()).isEqualTo(0.0);
    }

    @Test
    void missingProfile_throws404() {
        when(profileRepository.findByUserId("u5")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProgress("u5", LocalDate.now()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }
}
