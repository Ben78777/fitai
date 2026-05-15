package com.fitai.dto.response;

public class ProgressResponse {

    private int dailyCalorieTarget;
    private int todayCalories;
    private int todaySurplusDeficit;        // positive = surplus, negative = deficit
    private int accumulatedSurplusDeficit;  // positive = surplus, negative = deficit
    private double estimatedWeightChangeKg; // positive = gain, negative = loss
    private String goal;                    // "cutting" | "bulking" | "maintenance"
    private int calorieTargetOffset;        // current offset — for the inline editor
    private int tdee;                       // TDEE before goal offset — for chatbot context
    private double weightKg;               // user weight — for macro recommendation display

    public ProgressResponse(
            int dailyCalorieTarget,
            int todayCalories,
            int todaySurplusDeficit,
            int accumulatedSurplusDeficit,
            double estimatedWeightChangeKg,
            String goal,
            int calorieTargetOffset,
            int tdee,
            double weightKg) {
        this.dailyCalorieTarget = dailyCalorieTarget;
        this.todayCalories = todayCalories;
        this.todaySurplusDeficit = todaySurplusDeficit;
        this.accumulatedSurplusDeficit = accumulatedSurplusDeficit;
        this.estimatedWeightChangeKg = estimatedWeightChangeKg;
        this.goal = goal;
        this.calorieTargetOffset = calorieTargetOffset;
        this.tdee = tdee;
        this.weightKg = weightKg;
    }

    public int getDailyCalorieTarget()         { return dailyCalorieTarget; }
    public int getTodayCalories()              { return todayCalories; }
    public int getTodaySurplusDeficit()        { return todaySurplusDeficit; }
    public int getAccumulatedSurplusDeficit()  { return accumulatedSurplusDeficit; }
    public double getEstimatedWeightChangeKg() { return estimatedWeightChangeKg; }
    public String getGoal()                    { return goal; }
    public int getCalorieTargetOffset()        { return calorieTargetOffset; }
    public int getTdee()                       { return tdee; }
    public double getWeightKg()                { return weightKg; }
}
