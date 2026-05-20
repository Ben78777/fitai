package com.fitai.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class PredictResponse {

    private BigDecimal currentWeight;
    private BigDecimal predictedWeight;       // weight after projectionDays
    private BigDecimal estimatedChangeKg;     // positive = gain, negative = loss
    private BigDecimal averageDailyDeficit;   // positive = surplus, negative = deficit
    private int projectionDays;
    private List<ProjectionPoint> projectionPoints;
    private String goal;                      // "cutting" | "bulking" | "maintenance"

    public PredictResponse() {}

    public BigDecimal getCurrentWeight() { return currentWeight; }
    public void setCurrentWeight(BigDecimal currentWeight) { this.currentWeight = currentWeight; }

    public BigDecimal getPredictedWeight() { return predictedWeight; }
    public void setPredictedWeight(BigDecimal predictedWeight) { this.predictedWeight = predictedWeight; }

    public BigDecimal getEstimatedChangeKg() { return estimatedChangeKg; }
    public void setEstimatedChangeKg(BigDecimal estimatedChangeKg) { this.estimatedChangeKg = estimatedChangeKg; }

    public BigDecimal getAverageDailyDeficit() { return averageDailyDeficit; }
    public void setAverageDailyDeficit(BigDecimal averageDailyDeficit) { this.averageDailyDeficit = averageDailyDeficit; }

    public int getProjectionDays() { return projectionDays; }
    public void setProjectionDays(int projectionDays) { this.projectionDays = projectionDays; }

    public List<ProjectionPoint> getProjectionPoints() { return projectionPoints; }
    public void setProjectionPoints(List<ProjectionPoint> projectionPoints) { this.projectionPoints = projectionPoints; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    // ── Inner: one point on the prediction chart ──────────────────────────────
    public static class ProjectionPoint {
        private LocalDate date;
        private BigDecimal actual;     // null for future dates
        private BigDecimal predicted;  // filled for all points

        public ProjectionPoint() {}

        public ProjectionPoint(LocalDate date, BigDecimal actual, BigDecimal predicted) {
            this.date = date;
            this.actual = actual;
            this.predicted = predicted;
        }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public BigDecimal getActual() { return actual; }
        public void setActual(BigDecimal actual) { this.actual = actual; }

        public BigDecimal getPredicted() { return predicted; }
        public void setPredicted(BigDecimal predicted) { this.predicted = predicted; }
    }
}
