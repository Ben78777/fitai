package com.fitai.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public class LogEntryResponse {

    private UUID id;
    private String mealType;
    private String foodName;
    private BigDecimal quantityG;
    private BigDecimal calories;
    private BigDecimal proteinG;
    private BigDecimal carbsG;
    private BigDecimal fatG;

    // Micronutrients — nullable; absent from old entries before migration
    private BigDecimal fiberG;
    private BigDecimal sugarG;
    private BigDecimal sodiumMg;
    private BigDecimal potassiumMg;
    private BigDecimal vitaminCMg;
    private BigDecimal vitaminDMcg;
    private BigDecimal calciumMg;
    private BigDecimal ironMg;

    public LogEntryResponse() {}

    // --- Getters and Setters ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }

    public BigDecimal getQuantityG() { return quantityG; }
    public void setQuantityG(BigDecimal quantityG) { this.quantityG = quantityG; }

    public BigDecimal getCalories() { return calories; }
    public void setCalories(BigDecimal calories) { this.calories = calories; }

    public BigDecimal getProteinG() { return proteinG; }
    public void setProteinG(BigDecimal proteinG) { this.proteinG = proteinG; }

    public BigDecimal getCarbsG() { return carbsG; }
    public void setCarbsG(BigDecimal carbsG) { this.carbsG = carbsG; }

    public BigDecimal getFatG() { return fatG; }
    public void setFatG(BigDecimal fatG) { this.fatG = fatG; }

    public BigDecimal getFiberG() { return fiberG; }
    public void setFiberG(BigDecimal fiberG) { this.fiberG = fiberG; }

    public BigDecimal getSugarG() { return sugarG; }
    public void setSugarG(BigDecimal sugarG) { this.sugarG = sugarG; }

    public BigDecimal getSodiumMg() { return sodiumMg; }
    public void setSodiumMg(BigDecimal sodiumMg) { this.sodiumMg = sodiumMg; }

    public BigDecimal getPotassiumMg() { return potassiumMg; }
    public void setPotassiumMg(BigDecimal potassiumMg) { this.potassiumMg = potassiumMg; }

    public BigDecimal getVitaminCMg() { return vitaminCMg; }
    public void setVitaminCMg(BigDecimal vitaminCMg) { this.vitaminCMg = vitaminCMg; }

    public BigDecimal getVitaminDMcg() { return vitaminDMcg; }
    public void setVitaminDMcg(BigDecimal vitaminDMcg) { this.vitaminDMcg = vitaminDMcg; }

    public BigDecimal getCalciumMg() { return calciumMg; }
    public void setCalciumMg(BigDecimal calciumMg) { this.calciumMg = calciumMg; }

    public BigDecimal getIronMg() { return ironMg; }
    public void setIronMg(BigDecimal ironMg) { this.ironMg = ironMg; }
}
