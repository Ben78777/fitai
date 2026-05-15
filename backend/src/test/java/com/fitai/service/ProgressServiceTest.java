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
                                String goal, int offset) {
        UserProfile p = new UserProfile();
        p.setUserId(userId);
        p.setName("Test");
        p.setGender(gender);
        p.setAge(age);
        p.setWeightKg(BigDecimal.valueOf(weightKg));
        p.setHeightCm(BigDecimal.valueOf(heightCm));
        p.setGoal(goal);
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
    void cuttingGoal_female_calculatesCorrectly() {
        // Female, 28y, 62.5 kg, 168 cm → BMR = (10×62.5)+(6.25×168)−(5×28)−161
        //   = 625 + 1050 − 140 − 161 = 1374
        // dailyTarget = 1374 − 500 = 874
        // todayCalories = 1200  → surplus/deficit = 1200−874 = 326
        // totalCalories = 3000, days = 3 → accumulated = 3000−(874×3) = 378
        // weightChange = round(378/7700 × 100) / 100 = 0.05

        when(profileRepository.findByUserId("u1"))
                .thenReturn(Optional.of(profile("u1", "female", 28, 62.5, 168.0, "cutting", 500)));
        stubEntries("u1", 1200, 3000, 3);

        ProgressResponse r = service.getProgress("u1");

        assertThat(r.getDailyCalorieTarget()).isEqualTo(874);
        assertThat(r.getTodayCalories()).isEqualTo(1200);
        assertThat(r.getTodaySurplusDeficit()).isEqualTo(326);
        assertThat(r.getAccumulatedSurplusDeficit()).isEqualTo(378);
        assertThat(r.getEstimatedWeightChangeKg()).isEqualTo(0.05);
        assertThat(r.getGoal()).isEqualTo("cutting");
    }

    @Test
    void bulkingGoal_male_calculatesCorrectly() {
        // Male, 30y, 80 kg, 180 cm → BMR = (10×80)+(6.25×180)−(5×30)+5
        //   = 800 + 1125 − 150 + 5 = 1780
        // dailyTarget = 1780 + 300 = 2080
        // todayCalories = 2500 → surplus = 2500−2080 = 420
        // totalCalories = 5000, days = 2 → accumulated = 5000−(2080×2) = 840
        // weightChange = round(840/7700 × 100) / 100 = 0.11

        when(profileRepository.findByUserId("u2"))
                .thenReturn(Optional.of(profile("u2", "male", 30, 80.0, 180.0, "bulking", 300)));
        stubEntries("u2", 2500, 5000, 2);

        ProgressResponse r = service.getProgress("u2");

        assertThat(r.getDailyCalorieTarget()).isEqualTo(2080);
        assertThat(r.getTodayCalories()).isEqualTo(2500);
        assertThat(r.getTodaySurplusDeficit()).isEqualTo(420);
        assertThat(r.getAccumulatedSurplusDeficit()).isEqualTo(840);
        assertThat(r.getEstimatedWeightChangeKg()).isEqualTo(0.11);
        assertThat(r.getGoal()).isEqualTo("bulking");
    }

    @Test
    void maintenanceGoal_appliesNoOffset() {
        // Male, 30y, 80 kg, 180 cm → BMR = 1780, no offset
        // dailyTarget = 1780
        // todayCalories = 1800 → surplus = 20

        when(profileRepository.findByUserId("u3"))
                .thenReturn(Optional.of(profile("u3", "male", 30, 80.0, 180.0, "maintenance", 500)));
        stubEntries("u3", 1800, 1800, 1);

        ProgressResponse r = service.getProgress("u3");

        assertThat(r.getDailyCalorieTarget()).isEqualTo(1780);
        assertThat(r.getTodaySurplusDeficit()).isEqualTo(20);
        assertThat(r.getGoal()).isEqualTo("maintenance");
    }

    @Test
    void noEntries_returnsZeroCaloriesAndAccumulated() {
        when(profileRepository.findByUserId("u4"))
                .thenReturn(Optional.of(profile("u4", "female", 25, 60.0, 165.0, "cutting", 300)));
        // Repository returns null when no rows exist
        when(mealEntryRepository.sumCaloriesForDay(eq("u4"), any(LocalDate.class))).thenReturn(null);
        when(mealEntryRepository.sumAllCaloriesByUserId("u4")).thenReturn(null);
        when(mealEntryRepository.countDistinctDatesWithEntries("u4")).thenReturn(0L);

        ProgressResponse r = service.getProgress("u4");

        assertThat(r.getTodayCalories()).isEqualTo(0);
        assertThat(r.getAccumulatedSurplusDeficit()).isEqualTo(0);
        assertThat(r.getEstimatedWeightChangeKg()).isEqualTo(0.0);
    }

    @Test
    void missingProfile_throws404() {
        when(profileRepository.findByUserId("u5")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProgress("u5"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }
}
