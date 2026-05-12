package com.fitai.dto.response;

public class FoodSearchResult {

    private String productName;
    private double caloriesPer100g;
    private double proteinPer100g;
    private double carbsPer100g;
    private double fatPer100g;
    // Actual serving size returned by the API — used by the frontend for free-text mode totals
    private double servingSizeG;

    public FoodSearchResult(String productName, double caloriesPer100g,
                            double proteinPer100g, double carbsPer100g,
                            double fatPer100g, double servingSizeG) {
        this.productName = productName;
        this.caloriesPer100g = caloriesPer100g;
        this.proteinPer100g = proteinPer100g;
        this.carbsPer100g = carbsPer100g;
        this.fatPer100g = fatPer100g;
        this.servingSizeG = servingSizeG;
    }

    // --- Getters ---

    public String getProductName()    { return productName; }
    public double getCaloriesPer100g() { return caloriesPer100g; }
    public double getProteinPer100g()  { return proteinPer100g; }
    public double getCarbsPer100g()    { return carbsPer100g; }
    public double getFatPer100g()      { return fatPer100g; }
    public double getServingSizeG()    { return servingSizeG; }
}
