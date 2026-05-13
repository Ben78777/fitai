package com.fitai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitai.dto.response.FoodAnalysisResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    private static final String SYSTEM_PROMPT = """
            You are a nutrition expert. When given a food query, return ONLY a JSON array \
            with no markdown, no explanation. Each item must have:
            {
              "foodName": string,
              "quantityG": number (if specified, otherwise 100),
              "calories": number,
              "proteinG": number,
              "carbsG": number,
              "fatG": number
            }
            If the user types a single food like "chicken breast", return macros for 100g.
            If the user types "200g rice and 150g salmon", return two items with correct quantities and calculated macros.
            Only return the JSON array, nothing else.""";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String geminiApiKey;

    public GeminiService(RestTemplate restTemplate,
                         ObjectMapper objectMapper,
                         @Value("${gemini.api-key}") String geminiApiKey) {
        this.restTemplate  = restTemplate;
        this.objectMapper  = objectMapper;
        this.geminiApiKey  = geminiApiKey;
    }

    public List<FoodAnalysisResult> analyze(String query) {
        String url = GEMINI_URL + "?key=" + geminiApiKey;

        // Build the Gemini request body
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of(
                        "parts", List.of(Map.of("text", SYSTEM_PROMPT))
                ),
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", query.trim()))
                )),
                "generationConfig", Map.of(
                        "temperature", 0,
                        // Constrain output to valid JSON — no markdown fences
                        "responseMimeType", "application/json"
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        log.info("Calling Gemini for: '{}'", query);

        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class);
        } catch (Exception e) {
            log.error("Gemini API call failed for '{}': {}", query, e.getMessage());
            throw new RuntimeException("Food analysis failed: " + e.getMessage(), e);
        }

        log.info("Gemini responded {}", response.getStatusCode());

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            // Extract the text from candidates[0].content.parts[0].text
            String jsonText = root.path("candidates")
                                  .get(0)
                                  .path("content")
                                  .path("parts")
                                  .get(0)
                                  .path("text")
                                  .asText();

            log.info("Gemini raw result: {}",
                    jsonText.length() > 300 ? jsonText.substring(0, 300) + "…" : jsonText);

            List<FoodAnalysisResult> results =
                    objectMapper.readValue(jsonText, new TypeReference<>() {});

            log.info("Returning {} items for '{}'", results.size(), query);
            return results;

        } catch (Exception e) {
            log.error("Failed to parse Gemini response for '{}': {}", query, e.getMessage());
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage(), e);
        }
    }
}
