package com.fitai.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class AnalyticsResponse {

    private List<DailyEntry> dailyCalories;
    private List<WeightEntry> weightLogs;
    private BigDecimal averageCalories;
    private BigDecimal calorieTarget; // TDEE-based target for the reference line

    public AnalyticsResponse() {}

    public List<DailyEntry> getDailyCalories() { return dailyCalories; }
    public void setDailyCalories(List<DailyEntry> dailyCalories) { this.dailyCalories = dailyCalories; }

    public List<WeightEntry> getWeightLogs() { return weightLogs; }
    public void setWeightLogs(List<WeightEntry> weightLogs) { this.weightLogs = weightLogs; }

    public BigDecimal getAverageCalories() { return averageCalories; }
    public void setAverageCalories(BigDecimal averageCalories) { this.averageCalories = averageCalories; }

    public BigDecimal getCalorieTarget() { return calorieTarget; }
    public void setCalorieTarget(BigDecimal calorieTarget) { this.calorieTarget = calorieTarget; }

    // ── Inner: one bar in the calorie history chart ────────────────────────────
    public static class DailyEntry {
        private LocalDate date;
        private BigDecimal calories;
        private BigDecimal proteinG;
        private BigDecimal carbsG;
        private BigDecimal fatG;

        public DailyEntry() {}

        public DailyEntry(LocalDate date, BigDecimal calories,
                          BigDecimal proteinG, BigDecimal carbsG, BigDecimal fatG) {
            this.date = date;
            this.calories = calories;
            this.proteinG = proteinG;
            this.carbsG = carbsG;
            this.fatG = fatG;
        }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public BigDecimal getCalories() { return calories; }
        public void setCalories(BigDecimal calories) { this.calories = calories; }

        public BigDecimal getProteinG() { return proteinG; }
        public void setProteinG(BigDecimal proteinG) { this.proteinG = proteinG; }

        public BigDecimal getCarbsG() { return carbsG; }
        public void setCarbsG(BigDecimal carbsG) { this.carbsG = carbsG; }

        public BigDecimal getFatG() { return fatG; }
        public void setFatG(BigDecimal fatG) { this.fatG = fatG; }
    }

    // ── Inner: one point on the weight chart ──────────────────────────────────
    public static class WeightEntry {
        private LocalDate date;
        private BigDecimal weightKg;

        public WeightEntry() {}

        public WeightEntry(LocalDate date, BigDecimal weightKg) {
            this.date = date;
            this.weightKg = weightKg;
        }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public BigDecimal getWeightKg() { return weightKg; }
        public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
    }
}
