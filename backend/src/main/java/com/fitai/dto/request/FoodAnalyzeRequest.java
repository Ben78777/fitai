package com.fitai.dto.request;

import jakarta.validation.constraints.NotBlank;

public class FoodAnalyzeRequest {

    @NotBlank(message = "Query must not be blank")
    private String query;

    public FoodAnalyzeRequest() {}

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
}
