package com.fitai.dto.response;

public class ProgressResponse {

    private int dailyCalorieTarget;
    private int todayCalories;
    private int todaySurplusDeficit;        // positive = surplus, negative = deficit
    private int accumulatedSurplusDeficit;  // positive = surplus, negative = deficit
    private double estimatedWeightChangeKg; // positive = gain, negative = loss
    private String goal;                    // "cutting" | "bulking" | "maintenance"
    private int calorieTargetOffset;        // current offset — exposed so the UI can display it

    public ProgressResponse(
            int dailyCalorieTarget,
            int todayCalories,
            int todaySurplusDeficit,
            int accumulatedSurplusDeficit,
            double estimatedWeightChangeKg,
            String goal,
            int calorieTargetOffset) {
        this.dailyCalorieTarget = dailyCalorieTarget;
        this.todayCalories = todayCalories;
        this.todaySurplusDeficit = todaySurplusDeficit;
        this.accumulatedSurplusDeficit = accumulatedSurplusDeficit;
        this.estimatedWeightChangeKg = estimatedWeightChangeKg;
        this.goal = goal;
        this.calorieTargetOffset = calorieTargetOffset;
    }

    public int getDailyCalorieTarget()         { return dailyCalorieTarget; }
    public int getTodayCalories()              { return todayCalories; }
    public int getTodaySurplusDeficit()        { return todaySurplusDeficit; }
    public int getAccumulatedSurplusDeficit()  { return accumulatedSurplusDeficit; }
    public double getEstimatedWeightChangeKg() { return estimatedWeightChangeKg; }
    public String getGoal()                    { return goal; }
    public int getCalorieTargetOffset()        { return calorieTargetOffset; }
}
