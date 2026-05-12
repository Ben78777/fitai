package com.fitai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitai.dto.response.FoodSearchResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Service
public class FoodSearchService {

    private static final Logger log = LoggerFactory.getLogger(FoodSearchService.class);
    private static final String API_NINJAS_URL = "https://api.api-ninjas.com/v1/nutrition";
    private static final int MAX_RESULTS = 15;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiNinjasKey;

    public FoodSearchService(RestTemplate restTemplate,
                             ObjectMapper objectMapper,
                             @Value("${api-ninjas.key}") String apiNinjasKey) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.apiNinjasKey = apiNinjasKey;
    }

    public List<FoodSearchResult> search(String query) {
        String normalized = query.trim().replaceAll("\\s+", " ");

        // Build URI object — avoids double-encoding when passed to RestTemplate
        URI uri = UriComponentsBuilder.fromHttpUrl(API_NINJAS_URL)
                .queryParam("query", normalized)
                .build()
                .toUri();

        // API Ninjas requires the key in the request header
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiNinjasKey);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        List<FoodSearchResult> results = new ArrayList<>();

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, request, String.class);

            log.debug("API Ninjas responded {} for query '{}'", response.getStatusCode(), normalized);

            JsonNode items = objectMapper.readTree(response.getBody());

            for (JsonNode item : items) {
                if (results.size() >= MAX_RESULTS) break;

                String name     = item.path("name").asText("").trim();
                double servingG = item.path("serving_size_g").asDouble(100);
                double calories = item.path("calories").asDouble(0);
                double protein  = item.path("protein_g").asDouble(0);
                double carbs    = item.path("carbohydrates_total_g").asDouble(0);
                double fat      = item.path("fat_total_g").asDouble(0);

                if (name.isEmpty() || calories == 0) continue;

                // Normalize to per-100g so Mode 1 (pick + enter grams) works correctly
                double factor         = 100.0 / servingG;
                double calPer100g     = round(calories * factor);
                double proteinPer100g = round(protein  * factor);
                double carbsPer100g   = round(carbs    * factor);
                double fatPer100g     = round(fat      * factor);

                // Keep servingSizeG so Mode 2 (free-text totals) can recover actual amounts
                results.add(new FoodSearchResult(
                        capitalize(name),
                        calPer100g, proteinPer100g, carbsPer100g, fatPer100g,
                        servingG));
            }

            log.debug("Returning {} results for query '{}'", results.size(), normalized);

        } catch (Exception e) {
            // Log the real error so it shows up in Render logs
            log.error("Food search failed for query '{}': {}", normalized, e.getMessage(), e);
        }

        return results;
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    /** "chicken breast" → "Chicken Breast" */
    private String capitalize(String s) {
        String[] words = s.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!sb.isEmpty()) sb.append(' ');
            if (!w.isEmpty()) {
                sb.append(Character.toUpperCase(w.charAt(0)));
                if (w.length() > 1) sb.append(w.substring(1));
            }
        }
        return sb.toString();
    }
}
