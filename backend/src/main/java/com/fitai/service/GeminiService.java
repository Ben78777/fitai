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

    // Groq's OpenAI-compatible endpoint — free tier: 14,400 req/day, 30 RPM
    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.3-70b-versatile";

    // response_format:json_object requires "JSON" in the prompt and returns an object,
    // so we wrap results under an "items" key to stay within that constraint.
    private static final String SYSTEM_PROMPT =
            "You are a nutrition expert. Return ONLY a JSON object (no markdown, no extra text) " +
            "with a single key \"items\" containing an array of food entries. " +
            "Each entry must have exactly these fields: " +
            "foodName (string), quantityG (number — use the quantity given, or 100 if unspecified), " +
            "calories (number), proteinG (number), carbsG (number), fatG (number). " +
            "Example for input \"200g chicken breast and 1 banana\": " +
            "{\"items\":[" +
            "{\"foodName\":\"Chicken Breast\",\"quantityG\":200,\"calories\":330,\"proteinG\":62,\"carbsG\":0,\"fatG\":7.2}," +
            "{\"foodName\":\"Banana\",\"quantityG\":118,\"calories\":105,\"proteinG\":1.3,\"carbsG\":27,\"fatG\":0.4}" +
            "]}";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String groqApiKey;

    public GeminiService(RestTemplate restTemplate,
                         ObjectMapper objectMapper,
                         @Value("${groq.api-key}") String groqApiKey) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.groqApiKey = groqApiKey;
    }

    public List<FoodAnalysisResult> analyze(String query) {
        String requestBody;
        try {
            requestBody = buildRequestBody(query.trim());
        } catch (Exception e) {
            throw new RuntimeException("Failed to build request: " + e.getMessage(), e);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        log.info("Calling Groq for: '{}'", query);

        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(
                    GROQ_URL, HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    String.class);
        } catch (HttpClientErrorException e) {
            log.error("Groq API error {} for '{}': {}", e.getStatusCode(), query, e.getResponseBodyAsString());
            throw new RuntimeException("Food analysis failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Groq API call failed for '{}': {}", query, e.getMessage());
            throw new RuntimeException("Food analysis failed: " + e.getMessage(), e);
        }

        log.info("Groq responded {}", response.getStatusCode());

        try {
            JsonNode root = objectMapper.readTree(response.getBody());

            // OpenAI-compatible response: choices[0].message.content
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                log.error("Groq response has no choices: {}", response.getBody());
                throw new RuntimeException("Groq returned no choices");
            }

            String jsonText = choices.get(0).path("message").path("content").asText();

            log.info("Groq raw result: {}",
                    jsonText.length() > 300 ? jsonText.substring(0, 300) + "…" : jsonText);

            // Unwrap {"items":[...]} and deserialize the array
            JsonNode items = objectMapper.readTree(jsonText).path("items");
            List<FoodAnalysisResult> results =
                    objectMapper.convertValue(items, new TypeReference<List<FoodAnalysisResult>>() {});

            log.info("Returning {} items for '{}'", results.size(), query);
            return results;

        } catch (Exception e) {
            log.error("Failed to parse Groq response for '{}': {}", query, e.getMessage());
            throw new RuntimeException("Failed to parse Groq response: " + e.getMessage(), e);
        }
    }

    /** Build an OpenAI-compatible chat completion request body */
    private String buildRequestBody(String query) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", MODEL);
        root.put("temperature", 0.0);
        // json_object mode guarantees valid JSON output — no markdown fences
        root.set("response_format", objectMapper.createObjectNode().put("type", "json_object"));

        ArrayNode messages = objectMapper.createArrayNode();

        ObjectNode systemMsg = objectMapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content", SYSTEM_PROMPT);
        messages.add(systemMsg);

        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", query);
        messages.add(userMsg);

        root.set("messages", messages);
        return objectMapper.writeValueAsString(root);
    }
}
