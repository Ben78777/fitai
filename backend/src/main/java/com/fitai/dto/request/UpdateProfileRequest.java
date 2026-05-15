package com.fitai.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateProfileRequest {

    @NotNull(message = "Calorie offset is required")
    @Min(value = 100, message = "Calorie offset must be at least 100")
    @Max(value = 2000, message = "Calorie offset must be at most 2000")
    private Integer calorieTargetOffset;

    public UpdateProfileRequest() {}

    public Integer getCalorieTargetOffset() { return calorieTargetOffset; }
    public void setCalorieTargetOffset(Integer calorieTargetOffset) {
        this.calorieTargetOffset = calorieTargetOffset;
    }
}
