package com.fitai.dto.response;

public class FoodSearchResult {

    private String productName;
    private double caloriesPer100g;
    private double proteinPer100g;
    private double carbsPer100g;
    private double fatPer100g;

    public FoodSearchResult(String productName, double caloriesPer100g,
                            double proteinPer100g, double carbsPer100g, double fatPer100g) {
        this.productName = productName;
        this.caloriesPer100g = caloriesPer100g;
        this.proteinPer100g = proteinPer100g;
        this.carbsPer100g = carbsPer100g;
        this.fatPer100g = fatPer100g;
    }

    // --- Getters ---

    public String getProductName() { return productName; }
    public double getCaloriesPer100g() { return caloriesPer100g; }
    public double getProteinPer100g() { return proteinPer100g; }
    public double getCarbsPer100g() { return carbsPer100g; }
    public double getFatPer100g() { return fatPer100g; }
}
