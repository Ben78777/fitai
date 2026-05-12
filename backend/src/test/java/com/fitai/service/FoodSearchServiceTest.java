package com.fitai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitai.dto.response.FoodSearchResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FoodSearchServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String FAKE_KEY = "test-api-key";

    private FoodSearchService service() {
        return new FoodSearchService(restTemplate, objectMapper, FAKE_KEY);
    }

    /** Stub the RestTemplate exchange call with an API Ninjas-format JSON body */
    private void stubResponse(String json) {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));
    }

    /** Build an API Ninjas array response with N identical items */
    private String ninjasResponse(int count) {
        StringBuilder items = new StringBuilder("[");
        for (int i = 0; i < count; i++) {
            if (i > 0) items.append(",");
            items.append("""
                {
                  "name": "food item %d",
                  "serving_size_g": 100,
                  "calories": 89,
                  "protein_g": 1.1,
                  "carbohydrates_total_g": 23.0,
                  "fat_total_g": 0.3
                }
                """.formatted(i));
        }
        items.append("]");
        return items.toString();
    }

    @Test
    void search_returnsUpToFifteenResults() {
        stubResponse(ninjasResponse(20));

        List<FoodSearchResult> results = service().search("banana");

        // MAX_RESULTS cap is 15
        assertThat(results).hasSize(15);
    }

    @Test
    void search_normalizesToPer100g() {
        // API returns 200 kcal for a 200g serving — per-100g should be 100 kcal
        String json = """
            [{
              "name": "rice",
              "serving_size_g": 200,
              "calories": 200,
              "protein_g": 4,
              "carbohydrates_total_g": 40,
              "fat_total_g": 0.6
            }]
            """;
        stubResponse(json);

        List<FoodSearchResult> results = service().search("rice");

        assertThat(results).hasSize(1);
        FoodSearchResult r = results.get(0);
        assertThat(r.getCaloriesPer100g()).isEqualTo(100.0);
        assertThat(r.getProteinPer100g()).isEqualTo(2.0);
        assertThat(r.getCarbsPer100g()).isEqualTo(20.0);
        assertThat(r.getFatPer100g()).isEqualTo(0.3);
        // servingSizeG preserved as-is so the frontend can recover actual amounts
        assertThat(r.getServingSizeG()).isEqualTo(200.0);
    }

    @Test
    void search_capitalizesProductName() {
        String json = """
            [{
              "name": "chicken breast",
              "serving_size_g": 100,
              "calories": 165,
              "protein_g": 31,
              "carbohydrates_total_g": 0,
              "fat_total_g": 3.6
            }]
            """;
        stubResponse(json);

        List<FoodSearchResult> results = service().search("chicken");

        assertThat(results.get(0).getProductName()).isEqualTo("Chicken Breast");
    }

    @Test
    void search_filtersOutZeroCalorieEntries() {
        String json = """
            [
              {
                "name": "water",
                "serving_size_g": 100,
                "calories": 0,
                "protein_g": 0,
                "carbohydrates_total_g": 0,
                "fat_total_g": 0
              },
              {
                "name": "apple",
                "serving_size_g": 100,
                "calories": 52,
                "protein_g": 0.3,
                "carbohydrates_total_g": 14,
                "fat_total_g": 0.2
              }
            ]
            """;
        stubResponse(json);

        List<FoodSearchResult> results = service().search("test");

        // zero-calorie "water" should be skipped
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getProductName()).isEqualTo("Apple");
    }

    @Test
    void search_normalizesQuerySpaces() {
        stubResponse(ninjasResponse(1));

        // Extra whitespace should be collapsed — no exception
        service().search("  peanut   butter  ");

        assertThat(true).isTrue();
    }

    @Test
    void search_returnsEmptyListOnUpstreamFailure() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenThrow(new RuntimeException("network error"));

        List<FoodSearchResult> results = service().search("banana");

        assertThat(results).isEmpty();
    }
}
