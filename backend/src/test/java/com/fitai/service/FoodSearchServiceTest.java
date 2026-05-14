package com.fitai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitai.dto.response.FoodAnalysisResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FoodSearchServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String FAKE_KEY = "test-key";

    private GeminiService service() {
        return new GeminiService(restTemplate, objectMapper, FAKE_KEY);
    }

    /** Wrap a JSON items array string in the Groq OpenAI-compatible response envelope */
    private String groqResponse(String itemsJson) {
        // Escape the inner JSON so it sits safely inside the outer string value
        String escaped = itemsJson.replace("\\", "\\\\").replace("\"", "\\\"");
        return "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"{\\\"items\\\":" + escaped + "}\"}}]}";
    }

    private void stubResponse(String itemsJson) {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(groqResponse(itemsJson)));
    }

    @Test
    void analyze_parsesGroqResponseCorrectly() {
        stubResponse("[{\"foodName\":\"Banana\",\"quantityG\":100,\"calories\":89,\"proteinG\":1.1,\"carbsG\":22.8,\"fatG\":0.3}]");

        List<FoodAnalysisResult> results = service().analyze("banana");

        assertThat(results).hasSize(1);
        FoodAnalysisResult r = results.get(0);
        assertThat(r.getFoodName()).isEqualTo("Banana");
        assertThat(r.getQuantityG()).isEqualTo(100.0);
        assertThat(r.getCalories()).isEqualTo(89.0);
        assertThat(r.getProteinG()).isEqualTo(1.1);
    }

    @Test
    void analyze_returnsMultipleItemsForMealDescription() {
        stubResponse("[" +
                "{\"foodName\":\"Chicken Breast\",\"quantityG\":200,\"calories\":330,\"proteinG\":62,\"carbsG\":0,\"fatG\":7.2}," +
                "{\"foodName\":\"White Rice\",\"quantityG\":100,\"calories\":130,\"proteinG\":2.7,\"carbsG\":28.2,\"fatG\":0.3}" +
                "]");

        List<FoodAnalysisResult> results = service().analyze("200g chicken breast and 100g rice");

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getFoodName()).isEqualTo("Chicken Breast");
        assertThat(results.get(1).getFoodName()).isEqualTo("White Rice");
    }

    @Test
    void analyze_throwsOnUpstreamFailure() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(String.class)))
                .thenThrow(new RuntimeException("network error"));

        assertThatThrownBy(() -> service().analyze("banana"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Food analysis failed");
    }

    @Test
    void analyze_throwsOnMalformedResponse() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"choices\":[{\"message\":{\"content\":\"not valid json\"}}]}"));

        assertThatThrownBy(() -> service().analyze("banana"))
                .isInstanceOf(RuntimeException.class);
    }
}
