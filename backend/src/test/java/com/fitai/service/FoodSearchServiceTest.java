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

/**
 * Tests for OpenFoodFactsService — the active food search implementation.
 * FoodSearchService (API Ninjas) is kept in the codebase but not exposed
 * because the free tier does not return calories or protein.
 */
@ExtendWith(MockitoExtension.class)
class FoodSearchServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private OpenFoodFactsService service() {
        return new OpenFoodFactsService(restTemplate, objectMapper);
    }

    private void stubResponse(String json) {
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));
    }

    /** Minimal Open Food Facts product JSON with all required nutriment fields */
    private String offResponse(int count) {
        StringBuilder products = new StringBuilder();
        for (int i = 0; i < count; i++) {
            if (i > 0) products.append(",");
            products.append("""
                {
                  "product_name": "Food Item %d",
                  "brands": "Brand %d",
                  "nutriments": {
                    "energy-kcal_100g": 89,
                    "proteins_100g": 1.1,
                    "carbohydrates_100g": 23.0,
                    "fat_100g": 0.3
                  }
                }
                """.formatted(i, i));
        }
        return "{\"products\":[" + products + "]}";
    }

    @Test
    void search_returnsUpToFifteenResults() {
        stubResponse(offResponse(20));
        List<FoodSearchResult> results = service().search("banana");
        assertThat(results).hasSize(15);
    }

    @Test
    void search_skipsEntriesWithNoCalories() {
        String json = """
            {"products":[
              {
                "product_name": "No Calorie Food",
                "brands": "",
                "nutriments": {"energy-kcal_100g": 0, "proteins_100g": 0, "carbohydrates_100g": 0, "fat_100g": 0}
              },
              {
                "product_name": "Banana",
                "brands": "",
                "nutriments": {"energy-kcal_100g": 89, "proteins_100g": 1.1, "carbohydrates_100g": 23, "fat_100g": 0.3}
              }
            ]}
            """;
        stubResponse(json);
        List<FoodSearchResult> results = service().search("banana");
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getProductName()).isEqualTo("Banana");
    }

    @Test
    void search_skipsEntriesWithEmptyProductName() {
        String json = """
            {"products":[
              {"product_name": "", "brands": "", "nutriments": {"energy-kcal_100g": 89}},
              {"product_name": "Apple", "brands": "", "nutriments": {"energy-kcal_100g": 52, "proteins_100g": 0.3, "carbohydrates_100g": 14, "fat_100g": 0.2}}
            ]}
            """;
        stubResponse(json);
        List<FoodSearchResult> results = service().search("apple");
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getProductName()).isEqualTo("Apple");
    }

    @Test
    void search_appendsBrandWhenPresentAndDifferent() {
        String json = """
            {"products":[{
              "product_name": "Chicken Breast",
              "brands": "Tyson",
              "nutriments": {"energy-kcal_100g": 165, "proteins_100g": 31, "carbohydrates_100g": 0, "fat_100g": 3.6}
            }]}
            """;
        stubResponse(json);
        List<FoodSearchResult> results = service().search("chicken");
        assertThat(results.get(0).getProductName()).isEqualTo("Chicken Breast (Tyson)");
    }

    @Test
    void search_returnsServingSizeOf100() {
        stubResponse(offResponse(1));
        // Open Food Facts data is always per 100 g
        assertThat(service().search("test").get(0).getServingSizeG()).isEqualTo(100.0);
    }

    @Test
    void search_returnsEmptyListOnUpstreamFailure() {
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenThrow(new RuntimeException("network error"));
        assertThatThrownBy(() -> service().search("banana"))
                .isInstanceOf(RuntimeException.class);
    }

    // Helper to use AssertJ's assertThatThrownBy
    private static org.assertj.core.api.ThrowableTypeAssert<RuntimeException>
    assertThatThrownBy(org.assertj.core.api.ThrowableAssert.ThrowingCallable callable) {
        return org.assertj.core.api.Assertions.assertThatThrownBy(callable)
                .isInstanceOf(RuntimeException.class);
    }
}
