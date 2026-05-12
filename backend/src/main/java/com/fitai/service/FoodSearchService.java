package com.fitai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitai.dto.response.FoodSearchResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class FoodSearchService {

    private static final String USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
    private static final int MAX_RESULTS = 15;

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
        // Normalize: collapse extra spaces and lowercase
        String normalized = query.trim().replaceAll("\\s+", " ").toLowerCase();
        String[] queryWords = normalized.split(" ");

        String url = UriComponentsBuilder.fromHttpUrl(USDA_SEARCH_URL)
                .queryParam("query", normalized)
                .queryParam("api_key", usdaApiKey)
                // Fetch a large pool so we can re-rank and still have MAX_RESULTS after filtering
                .queryParam("pageSize", 100)
                .queryParam("dataType", "Branded")
                .toUriString();

        // Scored candidates before final sort
        record Candidate(FoodSearchResult result, int score) {}
        List<Candidate> candidates = new ArrayList<>();

        try {
            String json = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(json);
            JsonNode foods = root.path("foods");

            for (JsonNode food : foods) {
                String name  = food.path("description").asText("").trim();
                String brand = food.path("brandName").asText("").trim();
                if (name.isEmpty()) continue;

                Double kcal    = extractNutrient(food, NUTRIENT_ENERGY);
                Double protein = extractNutrient(food, NUTRIENT_PROTEIN);
                Double carbs   = extractNutrient(food, NUTRIENT_CARBS);
                Double fat     = extractNutrient(food, NUTRIENT_FAT);

                // Skip entries missing any macro
                if (kcal == null || protein == null || carbs == null || fat == null) continue;

                String nameLower = name.toLowerCase();

                // Score by relevance: higher = more relevant
                int score = 0;
                // All query words present in description
                int wordsMatched = 0;
                for (String word : queryWords) {
                    if (nameLower.contains(word)) wordsMatched++;
                }
                score += wordsMatched * 10;
                // Bonus if description starts with the query (e.g. "CHICKEN BREAST, ...")
                if (nameLower.startsWith(normalized)) score += 30;
                // Bonus if exact phrase is anywhere in description
                else if (nameLower.contains(normalized)) score += 15;
                // Prefer shorter descriptions — they tend to be simpler, more generic foods
                score -= name.length() / 10;

                // Convert ALL-CAPS USDA descriptions to Title Case for readability
                String displayName = toTitleCase(name);
                if (!brand.isEmpty()) displayName += " (" + toTitleCase(brand) + ")";

                candidates.add(new Candidate(
                        new FoodSearchResult(displayName, kcal, protein, carbs, fat), score));
            }
        } catch (Exception e) {
            // Return whatever partial results we have — don't crash on upstream issues
        }

        // Sort by score descending, then take top MAX_RESULTS
        return candidates.stream()
                .sorted(Comparator.comparingInt(Candidate::score).reversed())
                .limit(MAX_RESULTS)
                .map(Candidate::result)
                .toList();
    }

    /** Converts "CHICKEN BREAST, COOKED" → "Chicken Breast, Cooked" */
    private String toTitleCase(String input) {
        String[] words = input.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                if (!sb.isEmpty()) sb.append(' ');
                sb.append(Character.toUpperCase(word.charAt(0)));
                if (word.length() > 1) sb.append(word.substring(1).toLowerCase());
            }
        }
        return sb.toString();
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
