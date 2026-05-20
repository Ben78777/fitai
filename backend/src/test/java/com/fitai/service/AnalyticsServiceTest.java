package com.fitai.service;

import com.fitai.dto.response.AnalyticsResponse;
import com.fitai.dto.response.PredictResponse;
import com.fitai.model.UserProfile;
import com.fitai.model.WeightLog;
import com.fitai.repository.MealEntryRepository;
import com.fitai.repository.UserProfileRepository;
import com.fitai.repository.WeightLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock private MealEntryRepository    mealEntryRepository;
    @Mock private WeightLogRepository    weightLogRepository;
    @Mock private UserProfileRepository  userProfileRepository;
    @Mock private ProgressService        progressService;

    @InjectMocks
    private AnalyticsService service;

    private UserProfile profile;

    @BeforeEach
    void setUp() {
        profile = new UserProfile();
        profile.setUserId("user1");
        profile.setWeightKg(BigDecimal.valueOf(80.0));
        profile.setGoal("cutting");
        profile.setCalorieTargetOffset(500);
    }

    // ── getAnalytics ──────────────────────────────────────────────────────────

    @Test
    void getAnalytics_missingProfile_throws404() {
        when(userProfileRepository.findByUserId("noone")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getAnalytics("noone", 30))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void getAnalytics_withDays_returnsCorrectAverageAndEntries() {
        when(userProfileRepository.findByUserId("user1")).thenReturn(Optional.of(profile));
        when(progressService.computeTdee(profile)).thenReturn(2200);
        when(progressService.applyGoalOffset(2200, "cutting", 500)).thenReturn(1700);

        // Two days of meal data
        LocalDate d1 = LocalDate.of(2026, 5, 15);
        LocalDate d2 = LocalDate.of(2026, 5, 16);
        List<Object[]> rows = List.of(
                new Object[]{ d1, BigDecimal.valueOf(1800), BigDecimal.valueOf(120), BigDecimal.valueOf(200), BigDecimal.valueOf(60) },
                new Object[]{ d2, BigDecimal.valueOf(2000), BigDecimal.valueOf(140), BigDecimal.valueOf(220), BigDecimal.valueOf(70) }
        );
        when(mealEntryRepository.aggregateByDateSince(eq("user1"), any(LocalDate.class))).thenReturn(rows);
        when(weightLogRepository.findByUserIdAndLoggedAtGreaterThanEqualOrderByLoggedAtAsc(eq("user1"), any()))
                .thenReturn(List.of());

        AnalyticsResponse result = service.getAnalytics("user1", 30);

        assertThat(result.getDailyCalories()).hasSize(2);
        assertThat(result.getDailyCalories().get(0).getDate()).isEqualTo(d1);
        // average = (1800 + 2000) / 2 = 1900
        assertThat(result.getAverageCalories()).isEqualByComparingTo("1900");
        assertThat(result.getCalorieTarget()).isEqualByComparingTo("1700");
    }

    @Test
    void getAnalytics_allTime_usesAggregateAllByDate() {
        when(userProfileRepository.findByUserId("user1")).thenReturn(Optional.of(profile));
        when(progressService.computeTdee(profile)).thenReturn(2200);
        when(progressService.applyGoalOffset(2200, "cutting", 500)).thenReturn(1700);
        when(mealEntryRepository.aggregateAllByDate("user1")).thenReturn(List.of());
        when(weightLogRepository.findByUserIdOrderByLoggedAtAsc("user1")).thenReturn(List.of());

        // days=0 triggers all-time query
        AnalyticsResponse result = service.getAnalytics("user1", 0);

        assertThat(result.getDailyCalories()).isEmpty();
        assertThat(result.getAverageCalories()).isEqualByComparingTo("0");
    }

    @Test
    void getAnalytics_includesWeightLogs() {
        when(userProfileRepository.findByUserId("user1")).thenReturn(Optional.of(profile));
        when(progressService.computeTdee(profile)).thenReturn(2200);
        when(progressService.applyGoalOffset(2200, "cutting", 500)).thenReturn(1700);
        when(mealEntryRepository.aggregateByDateSince(eq("user1"), any())).thenReturn(List.of());

        WeightLog wl = new WeightLog();
        wl.setId(UUID.randomUUID());
        wl.setUserId("user1");
        wl.setWeightKg(BigDecimal.valueOf(79.5));
        wl.setLoggedAt(LocalDate.of(2026, 5, 15));
        when(weightLogRepository.findByUserIdAndLoggedAtGreaterThanEqualOrderByLoggedAtAsc(eq("user1"), any()))
                .thenReturn(List.of(wl));

        AnalyticsResponse result = service.getAnalytics("user1", 30);

        assertThat(result.getWeightLogs()).hasSize(1);
        assertThat(result.getWeightLogs().get(0).getWeightKg()).isEqualByComparingTo("79.5");
    }

    // ── predict ───────────────────────────────────────────────────────────────

    @Test
    void predict_missingProfile_throws404() {
        when(userProfileRepository.findByUserId("noone")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.predict("noone", 30))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void predict_noDaysLogged_returnsZeroChange() {
        when(userProfileRepository.findByUserId("user1")).thenReturn(Optional.of(profile));
        when(progressService.computeTdee(profile)).thenReturn(2200);
        // No applyGoalOffset stub — predict() uses TDEE directly, not dailyTarget
        when(mealEntryRepository.sumAllCaloriesByUserId("user1")).thenReturn(null);
        when(mealEntryRepository.countDistinctDatesWithEntries("user1")).thenReturn(0L);
        when(weightLogRepository.findByUserIdOrderByLoggedAtAsc("user1")).thenReturn(List.of());

        PredictResponse result = service.predict("user1", 30);

        assertThat(result.getEstimatedChangeKg()).isEqualByComparingTo("0.00");
        assertThat(result.getCurrentWeight()).isEqualByComparingTo("80.0");
        assertThat(result.getProjectionPoints()).hasSize(31); // day 0 through day 30
        assertThat(result.getGoal()).isEqualTo("cutting");
    }

    @Test
    void predict_maintenanceGoal_alwaysReturnsZeroChange() {
        // Maintenance goal → flat line regardless of calorie history
        UserProfile maintenanceProfile = new UserProfile();
        maintenanceProfile.setUserId("user1");
        maintenanceProfile.setWeightKg(BigDecimal.valueOf(80.0));
        maintenanceProfile.setGoal("maintenance");
        maintenanceProfile.setCalorieTargetOffset(500); // offset irrelevant for maintenance
        when(userProfileRepository.findByUserId("user1")).thenReturn(Optional.of(maintenanceProfile));
        when(progressService.computeTdee(maintenanceProfile)).thenReturn(2200);
        // Has calorie history that would imply a deficit if goal weren't maintenance
        when(mealEntryRepository.sumAllCaloriesByUserId("user1")).thenReturn(BigDecimal.valueOf(12000));
        when(mealEntryRepository.countDistinctDatesWithEntries("user1")).thenReturn(10L);
        when(weightLogRepository.findByUserIdOrderByLoggedAtAsc("user1")).thenReturn(List.of());

        PredictResponse result = service.predict("user1", 30);

        // No change regardless of eating history
        assertThat(result.getEstimatedChangeKg()).isEqualByComparingTo("0.00");
        assertThat(result.getAverageDailyDeficit()).isEqualByComparingTo("0.0");
        assertThat(result.getPredictedWeight()).isEqualByComparingTo("80.0");
        assertThat(result.getGoal()).isEqualTo("maintenance");
        // All predicted points should be at current weight
        assertThat(result.getProjectionPoints()).hasSize(31);
        result.getProjectionPoints().forEach(p ->
            assertThat(p.getPredicted()).isEqualByComparingTo("80.00")
        );
    }

    @Test
    void predict_consistentDeficit_estimatesWeightLoss() {
        when(userProfileRepository.findByUserId("user1")).thenReturn(Optional.of(profile));
        when(progressService.computeTdee(profile)).thenReturn(2200);
        // No applyGoalOffset stub — predict() uses TDEE directly

        // Ate 1200 kcal/day for 10 days → deficit vs TDEE = 2200−1200 = 1000 kcal/day
        when(mealEntryRepository.sumAllCaloriesByUserId("user1")).thenReturn(BigDecimal.valueOf(12000));
        when(mealEntryRepository.countDistinctDatesWithEntries("user1")).thenReturn(10L);
        when(weightLogRepository.findByUserIdOrderByLoggedAtAsc("user1")).thenReturn(List.of());

        PredictResponse result = service.predict("user1", 30);

        // 1000 kcal/day deficit × 30 days / 7700 ≈ 3.9 kg loss
        assertThat(result.getEstimatedChangeKg().doubleValue()).isLessThan(0);
        assertThat(result.getAverageDailyDeficit().doubleValue()).isGreaterThan(0);
        assertThat(result.getProjectionPoints()).hasSize(31);
        assertThat(result.getGoal()).isEqualTo("cutting");
    }

    @Test
    void predict_projectionPointsHaveActualValueForTodayOnly() {
        when(userProfileRepository.findByUserId("user1")).thenReturn(Optional.of(profile));
        when(progressService.computeTdee(profile)).thenReturn(2200);
        // No applyGoalOffset stub — predict() uses TDEE directly
        when(mealEntryRepository.sumAllCaloriesByUserId("user1")).thenReturn(BigDecimal.valueOf(1700));
        when(mealEntryRepository.countDistinctDatesWithEntries("user1")).thenReturn(1L);

        // One actual log for today
        WeightLog todayLog = new WeightLog();
        todayLog.setId(UUID.randomUUID());
        todayLog.setUserId("user1");
        todayLog.setWeightKg(BigDecimal.valueOf(80.0));
        todayLog.setLoggedAt(LocalDate.now());
        when(weightLogRepository.findByUserIdOrderByLoggedAtAsc("user1")).thenReturn(List.of(todayLog));

        PredictResponse result = service.predict("user1", 7);

        // Day 0 (today) should have an actual value
        PredictResponse.ProjectionPoint today = result.getProjectionPoints().get(0);
        assertThat(today.getDate()).isEqualTo(LocalDate.now());
        assertThat(today.getActual()).isNotNull();

        // Day 1 onwards should have null actual
        PredictResponse.ProjectionPoint tomorrow = result.getProjectionPoints().get(1);
        assertThat(tomorrow.getActual()).isNull();
    }
}
