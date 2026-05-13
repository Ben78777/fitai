package com.fitai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitai.dto.response.FoodSearchResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

/**
 * Food name search backed by Open Food Facts — free, no API key required.
 * All returned values are per 100 g so the frontend can scale to any quantity.
 */
@Service
public class OpenFoodFactsService {

    private static final Logger log = LoggerFactory.getLogger(OpenFoodFactsService.class);
    private static final String OFF_URL = "https://world.openfoodfacts.org/cgi/search.pl";
    private static final int MAX_RESULTS = 15;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OpenFoodFactsService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public List<FoodSearchResult> search(String query) {
        String normalized = query.trim().replaceAll("\\s+", " ");

        // Fetch extra results so we still hit MAX_RESULTS after filtering incomplete entries
        URI uri = UriComponentsBuilder.fromHttpUrl(OFF_URL)
                .queryParam("search_terms", normalized)
                .queryParam("json", "1")
                .queryParam("page_size", "50")
                .queryParam("fields", "product_name,brands,nutriments")
                .queryParam("sort_by", "unique_scans_n")   // sort by scan popularity
                .build()
                .toUri();

        // Open Food Facts asks for a meaningful User-Agent in their usage guidelines
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "FitAI/1.0 (https://fitai-tracker.netlify.app)");
        HttpEntity<Void> request = new HttpEntity<>(headers);

        log.info("Calling Open Food Facts for '{}'", normalized);

        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(uri, HttpMethod.GET, request, String.class);
        } catch (Exception e) {
            log.error("Open Food Facts request failed for '{}': {}", normalized, e.getMessage());
            throw new RuntimeException("Food search failed: " + e.getMessage(), e);
        }

        log.info("Open Food Facts responded {} for '{}'", response.getStatusCode(), normalized);

        List<FoodSearchResult> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode products = root.path("products");

            for (JsonNode product : products) {
                if (results.size() >= MAX_RESULTS) break;

                String name = product.path("product_name").asText("").trim();
                if (name.isEmpty()) continue;

                JsonNode n = product.path("nutriments");

                // Prefer the explicit kcal field; fall back to converting kJ
                double calories = n.path("energy-kcal_100g").asDouble(0);
                if (calories == 0) {
                    double kj = n.path("energy_100g").asDouble(0);
                    if (kj > 0) calories = kj / 4.184;
                }
                if (calories == 0) continue; // skip entries with no calorie data

                double protein = n.path("proteins_100g").asDouble(0);
                double carbs   = n.path("carbohydrates_100g").asDouble(0);
                double fat     = n.path("fat_100g").asDouble(0);

                // Append the first brand if present and distinct from the product name
                String brand = product.path("brands").asText("").trim();
                String displayName = toTitleCase(name);
                if (!brand.isEmpty()) {
                    String firstBrand = toTitleCase(brand.split(",")[0].trim());
                    if (!firstBrand.isEmpty() && !firstBrand.equalsIgnoreCase(displayName)) {
                        displayName += " (" + firstBrand + ")";
                    }
                }

                // Open Food Facts data is already per 100 g
                results.add(new FoodSearchResult(
                        displayName,
                        round(calories), round(protein), round(carbs), round(fat),
                        100.0));
            }
        } catch (Exception e) {
            log.error("Failed to parse Open Food Facts response for '{}': {}", normalized, e.getMessage());
            throw new RuntimeException("Failed to parse food search response", e);
        }

        log.info("Returning {} results for '{}'", results.size(), normalized);
        return results;
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private String toTitleCase(String s) {
        if (s == null || s.isEmpty()) return s;
        String[] words = s.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!sb.isEmpty()) sb.append(' ');
            if (!w.isEmpty()) {
                sb.append(Character.toUpperCase(w.charAt(0)));
                if (w.length() > 1) sb.append(w.substring(1).toLowerCase());
            }
        }
        return sb.toString();
    }
}
