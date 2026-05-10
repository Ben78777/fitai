package com.fitai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitai.dto.response.FoodSearchResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Service
public class FoodSearchService {

    private static final String USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
    private static final int MAX_RESULTS = 10;

    // USDA nutrient IDs for the four macros we care about
    private static final int NUTRIENT_ENERGY  = 1008; // kcal
    private static final int NUTRIENT_PROTEIN = 1003;
    private static final int NUTRIENT_CARBS   = 1005;
    private static final int NUTRIENT_FAT     = 1004;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String usdaApiKey;

    public FoodSearchService(RestTemplate restTemplate,
                             ObjectMapper objectMapper,
                             @Value("${usda.api-key}") String usdaApiKey) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.usdaApiKey = usdaApiKey;
    }

    public List<FoodSearchResult> search(String query) {
        // Normalize: collapse extra spaces and lowercase so "Peanut  Butter" == "peanut butter"
        String normalized = query.trim().replaceAll("\\s+", " ").toLowerCase();

        String url = UriComponentsBuilder.fromHttpUrl(USDA_SEARCH_URL)
                .queryParam("query", normalized)
                .queryParam("api_key", usdaApiKey)
                // Fetch extra so we still have MAX_RESULTS after filtering incomplete entries
                .queryParam("pageSize", MAX_RESULTS)
                .queryParam("dataType", "Foundation,SR Legacy")
                .toUriString();

        List<FoodSearchResult> results = new ArrayList<>();

        try {
            String json = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(json);
            JsonNode foods = root.path("foods");

            for (JsonNode food : foods) {
                if (results.size() >= MAX_RESULTS) break;

                String name  = food.path("description").asText("").trim();
                String brand = food.path("brandName").asText("").trim();
                if (name.isEmpty()) continue;

                // Show brand in parentheses so users can tell "Chicken Breast (Tyson)" from generic
                String displayName = brand.isEmpty() ? name : name + " (" + brand + ")";

                Double kcal    = extractNutrient(food, NUTRIENT_ENERGY);
                Double protein = extractNutrient(food, NUTRIENT_PROTEIN);
                Double carbs   = extractNutrient(food, NUTRIENT_CARBS);
                Double fat     = extractNutrient(food, NUTRIENT_FAT);

                // Skip entries missing any macro
                if (kcal == null || protein == null || carbs == null || fat == null) continue;

                results.add(new FoodSearchResult(displayName, kcal, protein, carbs, fat));
            }
        } catch (Exception e) {
            // Return whatever partial results we have — don't crash on upstream issues
        }

        return results;
    }

    private Double extractNutrient(JsonNode food, int nutrientId) {
        for (JsonNode n : food.path("foodNutrients")) {
            if (n.path("nutrientId").asInt() == nutrientId) {
                double val = n.path("value").asDouble(-1);
                return val >= 0 ? val : null;
            }
        }
        return null;
    }
}
