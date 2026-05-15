package com.fitai.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * PATCH /api/v1/profile request body.
 * All fields are optional — only non-null values are applied to the profile.
 * Name, gender, and height are intentionally excluded (they don't change after onboarding).
 */
public class UpdateProfileRequest {

    @DecimalMin(value = "1.0", message = "Weight must be at least 1 kg")
    @DecimalMax(value = "500.0", message = "Weight must be at most 500 kg")
    private BigDecimal weightKg;

    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 120, message = "Age must be at most 120")
    private Integer age;

    @Pattern(regexp = "cutting|bulking|maintenance",
             message = "Goal must be cutting, bulking, or maintenance")
    private String goal;

    @Pattern(regexp = "sedentary|lightly_active|moderately_active|very_active|extremely_active",
             message = "Invalid activity level")
    private String activityLevel;

    @Min(value = 100, message = "Calorie offset must be at least 100")
    @Max(value = 2000, message = "Calorie offset must be at most 2000")
    private Integer calorieTargetOffset;

    public UpdateProfileRequest() {}

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }

    public Integer getCalorieTargetOffset() { return calorieTargetOffset; }
    public void setCalorieTargetOffset(Integer calorieTargetOffset) {
        this.calorieTargetOffset = calorieTargetOffset;
    }
}
