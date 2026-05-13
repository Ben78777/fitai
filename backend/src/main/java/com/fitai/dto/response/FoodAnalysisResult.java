package com.fitai.dto.response;

/**
 * One food item returned by Gemini — already contains the actual quantity
 * and pre-calculated macros (not per-100g), ready to log directly.
 */
public class FoodAnalysisResult {

    private String foodName;
    private double quantityG;
    private double calories;
    private double proteinG;
    private double carbsG;
    private double fatG;

    // No-arg constructor required for Jackson deserialization
    public FoodAnalysisResult() {}

    public FoodAnalysisResult(String foodName, double quantityG,
                              double calories, double proteinG,
                              double carbsG, double fatG) {
        this.foodName  = foodName;
        this.quantityG = quantityG;
        this.calories  = calories;
        this.proteinG  = proteinG;
        this.carbsG    = carbsG;
        this.fatG      = fatG;
    }

    public String getFoodName()  { return foodName; }
    public double getQuantityG() { return quantityG; }
    public double getCalories()  { return calories; }
    public double getProteinG()  { return proteinG; }
    public double getCarbsG()    { return carbsG; }
    public double getFatG()      { return fatG; }

    public void setFoodName(String foodName)   { this.foodName  = foodName; }
    public void setQuantityG(double quantityG) { this.quantityG = quantityG; }
    public void setCalories(double calories)   { this.calories  = calories; }
    public void setProteinG(double proteinG)   { this.proteinG  = proteinG; }
    public void setCarbsG(double carbsG)       { this.carbsG    = carbsG; }
    public void setFatG(double fatG)           { this.fatG      = fatG; }
}
