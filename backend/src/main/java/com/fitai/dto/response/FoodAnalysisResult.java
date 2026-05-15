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

    // Micronutrients — nullable (not all foods have this data available)
    private Double fiberG;
    private Double sugarG;
    private Double sodiumMg;
    private Double potassiumMg;
    private Double vitaminCMg;
    private Double vitaminDMcg;
    private Double calciumMg;
    private Double ironMg;

    // No-arg constructor required for Jackson deserialization
    public FoodAnalysisResult() {}

    public String getFoodName()  { return foodName; }
    public double getQuantityG() { return quantityG; }
    public double getCalories()  { return calories; }
    public double getProteinG()  { return proteinG; }
    public double getCarbsG()    { return carbsG; }
    public double getFatG()      { return fatG; }
    public Double getFiberG()    { return fiberG; }
    public Double getSugarG()    { return sugarG; }
    public Double getSodiumMg()  { return sodiumMg; }
    public Double getPotassiumMg() { return potassiumMg; }
    public Double getVitaminCMg()  { return vitaminCMg; }
    public Double getVitaminDMcg() { return vitaminDMcg; }
    public Double getCalciumMg()   { return calciumMg; }
    public Double getIronMg()      { return ironMg; }

    public void setFoodName(String foodName)   { this.foodName  = foodName; }
    public void setQuantityG(double quantityG) { this.quantityG = quantityG; }
    public void setCalories(double calories)   { this.calories  = calories; }
    public void setProteinG(double proteinG)   { this.proteinG  = proteinG; }
    public void setCarbsG(double carbsG)       { this.carbsG    = carbsG; }
    public void setFatG(double fatG)           { this.fatG      = fatG; }
    public void setFiberG(Double fiberG)       { this.fiberG    = fiberG; }
    public void setSugarG(Double sugarG)       { this.sugarG    = sugarG; }
    public void setSodiumMg(Double sodiumMg)   { this.sodiumMg  = sodiumMg; }
    public void setPotassiumMg(Double v)       { this.potassiumMg = v; }
    public void setVitaminCMg(Double v)        { this.vitaminCMg  = v; }
    public void setVitaminDMcg(Double v)       { this.vitaminDMcg = v; }
    public void setCalciumMg(Double v)         { this.calciumMg   = v; }
    public void setIronMg(Double v)            { this.ironMg      = v; }
}
