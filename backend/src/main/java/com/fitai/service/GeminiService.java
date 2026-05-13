package com.fitai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fitai.dto.response.FoodAnalysisResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    private static final String SYSTEM_PROMPT =
            "You are a nutrition expert. When given a food query, return ONLY a JSON array " +
            "with no markdown, no explanation. Each item must have: " +
            "{\"foodName\": string, \"quantityG\": number (if specified, otherwise 100), " +
            "\"calories\": number, \"proteinG\": number, \"carbsG\": number, \"fatG\": number}. " +
            "If the user types a single food like \"chicken breast\", return macros for 100g. " +
            "If the user types \"200g rice and 150g salmon\", return two items with correct quantities and calculated macros. " +
            "Only return the JSON array, nothing else.";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String geminiApiKey;

    public GeminiService(RestTemplate restTemplate,
                         ObjectMapper objectMapper,
                         @Value("${gemini.api-key}") String geminiApiKey) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.geminiApiKey = geminiApiKey;
    }

    public List<FoodAnalysisResult> analyze(String query) {
        String url = GEMINI_URL + "?key=" + geminiApiKey;

        // Build request body with ObjectNode to guarantee correct JSON serialization
        String requestBody;
        try {
            requestBody = buildRequestBody(query.trim());
        } catch (Exception e) {
            throw new RuntimeException("Failed to build Gemini request: " + e.getMessage(), e);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        log.info("Calling Gemini for: '{}'", query);

        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    String.class);
        } catch (HttpClientErrorException e) {
            // Log Gemini's error body so we can see exactly what went wrong
            log.error("Gemini API error {} for '{}': {}", e.getStatusCode(), query, e.getResponseBodyAsString());
            throw new RuntimeException("Food analysis failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Gemini API call failed for '{}': {}", query, e.getMessage());
            throw new RuntimeException("Food analysis failed: " + e.getMessage(), e);
        }

        log.info("Gemini responded {}", response.getStatusCode());

        try {
            JsonNode root = objectMapper.readTree(response.getBody());

            // Extract the text from candidates[0].content.parts[0].text
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                log.error("Gemini response has no candidates: {}", response.getBody());
                throw new RuntimeException("Gemini returned no candidates");
            }

            String jsonText = candidates.get(0)
                                        .path("content")
                                        .path("parts")
                                        .get(0)
                                        .path("text")
                                        .asText();

            log.info("Gemini raw result: {}",
                    jsonText.length() > 300 ? jsonText.substring(0, 300) + "…" : jsonText);

            // Explicit type parameter prevents type-erasure from deserializing as List<LinkedHashMap>
            List<FoodAnalysisResult> results =
                    objectMapper.readValue(jsonText, new TypeReference<List<FoodAnalysisResult>>() {});

            log.info("Returning {} items for '{}'", results.size(), query);
            return results;

        } catch (Exception e) {
            log.error("Failed to parse Gemini response for '{}': {}", query, e.getMessage());
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage(), e);
        }
    }

    /** Build the Gemini JSON request body using Jackson nodes — no Map.of() surprises */
    private String buildRequestBody(String query) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();

        // systemInstruction
        ObjectNode systemInstruction = objectMapper.createObjectNode();
        ArrayNode sysParts = objectMapper.createArrayNode();
        sysParts.add(objectMapper.createObjectNode().put("text", SYSTEM_PROMPT));
        systemInstruction.set("parts", sysParts);
        root.set("systemInstruction", systemInstruction);

        // contents
        ArrayNode contents = objectMapper.createArrayNode();
        ObjectNode userTurn = objectMapper.createObjectNode();
        userTurn.put("role", "user");
        ArrayNode userParts = objectMapper.createArrayNode();
        userParts.add(objectMapper.createObjectNode().put("text", query));
        userTurn.set("parts", userParts);
        contents.add(userTurn);
        root.set("contents", contents);

        // generationConfig — responseMimeType constrains output to valid JSON
        ObjectNode config = objectMapper.createObjectNode();
        config.put("temperature", 0.0);
        config.put("responseMimeType", "application/json");
        root.set("generationConfig", config);

        return objectMapper.writeValueAsString(root);
    }
}
