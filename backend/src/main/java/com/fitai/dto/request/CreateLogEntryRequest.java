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
}
