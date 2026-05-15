package com.fitai.dto.response;

import java.math.BigDecimal;

public class UserProfileResponse {

    private String id;
    private String name;
    private String gender;
    private int age;
    private BigDecimal weightKg;
    private BigDecimal heightCm;
    private String goal;
    private int calorieTargetOffset;

    public UserProfileResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public BigDecimal getHeightCm() { return heightCm; }
    public void setHeightCm(BigDecimal heightCm) { this.heightCm = heightCm; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public int getCalorieTargetOffset() { return calorieTargetOffset; }
    public void setCalorieTargetOffset(int calorieTargetOffset) { this.calorieTargetOffset = calorieTargetOffset; }
}
