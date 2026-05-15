package com.fitai.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateLogEntryRequest {

    @NotNull(message = "date is required")
    private LocalDate date;

    @NotBlank(message = "mealType is required")
    @Pattern(regexp = "breakfast|lunch|dinner|snack",
             message = "mealType must be breakfast, lunch, dinner, or snack")
    private String mealType;

    @NotBlank(message = "foodName is required")
    private String foodName;

    @NotNull(message = "quantityG is required")
    @DecimalMin(value = "0.1", message = "quantityG must be greater than 0")
    private BigDecimal quantityG;

    @NotNull(message = "calories is required")
    @DecimalMin(value = "0.0", message = "calories cannot be negative")
    private BigDecimal calories;

    @NotNull(message = "proteinG is required")
    @DecimalMin(value = "0.0", message = "proteinG cannot be negative")
    private BigDecimal proteinG;

    @NotNull(message = "carbsG is required")
    @DecimalMin(value = "0.0", message = "carbsG cannot be negative")
    private BigDecimal carbsG;

    @NotNull(message = "fatG is required")
    @DecimalMin(value = "0.0", message = "fatG cannot be negative")
    private BigDecimal fatG;

    // Micronutrients — all optional; null means data was not available
    private BigDecimal fiberG;
    private BigDecimal sugarG;
    private BigDecimal sodiumMg;
    private BigDecimal potassiumMg;
    private BigDecimal vitaminCMg;
    private BigDecimal vitaminDMcg;
    private BigDecimal calciumMg;
    private BigDecimal ironMg;

    // --- Getters and Setters ---

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

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
