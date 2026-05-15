package com.fitai.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class CreateProfileRequest {

    @NotBlank(message = "Name must not be blank")
    private String name;

    @NotBlank(message = "Gender must not be blank")
    private String gender;

    @NotNull(message = "Age is required")
    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 150, message = "Age must be at most 150")
    private Integer age;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "1.0", message = "Weight must be positive")
    private BigDecimal weightKg;

    @NotNull(message = "Height is required")
    @DecimalMin(value = "50.0", message = "Height must be at least 50 cm")
    private BigDecimal heightCm;

    @NotBlank(message = "Goal must not be blank")
    private String goal;

    @NotBlank(message = "Activity level must not be blank")
    private String activityLevel;

    // Optional — service defaults to 500 when null
    private Integer calorieTargetOffset;

    public CreateProfileRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public BigDecimal getHeightCm() { return heightCm; }
    public void setHeightCm(BigDecimal heightCm) { this.heightCm = heightCm; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }

    public Integer getCalorieTargetOffset() { return calorieTargetOffset; }
    public void setCalorieTargetOffset(Integer calorieTargetOffset) { this.calorieTargetOffset = calorieTargetOffset; }
}
