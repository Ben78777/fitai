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

    // Constructor for mapping from entity
    public LogEntryResponse(UUID id, String mealType, String foodName,
                            BigDecimal quantityG, BigDecimal calories,
                            BigDecimal proteinG, BigDecimal carbsG, BigDecimal fatG) {
        this.id = id;
        this.mealType = mealType;
        this.foodName = foodName;
        this.quantityG = quantityG;
        this.calories = calories;
        this.proteinG = proteinG;
        this.carbsG = carbsG;
        this.fatG = fatG;
    }

    // --- Getters ---

    public UUID getId() { return id; }
    public String getMealType() { return mealType; }
    public String getFoodName() { return foodName; }
    public BigDecimal getQuantityG() { return quantityG; }
    public BigDecimal getCalories() { return calories; }
    public BigDecimal getProteinG() { return proteinG; }
    public BigDecimal getCarbsG() { return carbsG; }
    public BigDecimal getFatG() { return fatG; }
}
