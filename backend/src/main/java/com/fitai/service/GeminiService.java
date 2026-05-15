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

    private static final String TEXT_MODEL  = "llama-3.3-70b-versatile";
    private static final String VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

    // Text analysis: response_format=json_object guarantees clean JSON,
    // so we wrap results under {"items":[...]} to satisfy the object constraint.
    // Micronutrient fields are optional — use null when unknown.
    private static final String TEXT_SYSTEM_PROMPT =
            "You are a nutrition expert. Return ONLY a JSON object (no markdown, no extra text) " +
            "with a single key \"items\" containing an array of food entries. " +
            "Each entry must have these fields: " +
            "foodName (string), quantityG (number — use the quantity given, or 100 if unspecified), " +
            "calories (number), proteinG (number), carbsG (number), fatG (number), " +
            "fiberG (number or null), sugarG (number or null), sodiumMg (number or null), " +
            "potassiumMg (number or null), vitaminCMg (number or null), vitaminDMcg (number or null), " +
            "calciumMg (number or null), ironMg (number or null). " +
            "Set micronutrient fields to null when data is unavailable. " +
            "Example for \"200g chicken breast\": " +
            "{\"items\":[{\"foodName\":\"Chicken Breast\",\"quantityG\":200,\"calories\":330," +
            "\"proteinG\":62,\"carbsG\":0,\"fatG\":7.2,\"fiberG\":0,\"sugarG\":0," +
            "\"sodiumMg\":148,\"potassiumMg\":440,\"vitaminCMg\":0,\"vitaminDMcg\":null," +
            "\"calciumMg\":14,\"ironMg\":1.4}]}";

    // Image analysis: vision models may not support response_format,
    // so we ask for JSON in the prompt and strip markdown fences in parsing.
    // Micronutrient fields are optional — use null when unknown.
    private static final String IMAGE_SYSTEM_PROMPT =
            "You are a nutrition expert. Identify every food item visible in the image and " +
            "return ONLY a JSON object with a single key \"items\" containing an array. " +
            "Each entry must have: foodName (string), quantityG (number — estimate the portion), " +
            "calories (number), proteinG (number), carbsG (number), fatG (number), " +
            "fiberG (number or null), sugarG (number or null), sodiumMg (number or null), " +
            "potassiumMg (number or null), vitaminCMg (number or null), vitaminDMcg (number or null), " +
            "calciumMg (number or null), ironMg (number or null). " +
            "Set micronutrient fields to null when data is unavailable. " +
            "No markdown, no explanation — only the JSON object.";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String groqApiKey;

    public GeminiService(RestTemplate restTemplate,
                         ObjectMapper objectMapper,
                         @Value("${groq.api-key}") String groqApiKey) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.groqApiKey   = groqApiKey;
    }

    // ── Text analysis ──────────────────────────────────────────────

    public List<FoodAnalysisResult> analyze(String query) {
        String requestBody;
        try {
            requestBody = buildTextRequestBody(query.trim());
        } catch (Exception e) {
            throw new RuntimeException("Failed to build request: " + e.getMessage(), e);
        }

        log.info("Calling Groq (text) for: '{}'", query);
        String content = callGroq(requestBody, query);

        try {
            JsonNode items = objectMapper.readTree(content).path("items");
            List<FoodAnalysisResult> results =
                    objectMapper.convertValue(items, new TypeReference<List<FoodAnalysisResult>>() {});
            log.info("Returning {} items for '{}'", results.size(), query);
            return results;
        } catch (Exception e) {
            log.error("Failed to parse Groq text response for '{}': {}", query, e.getMessage());
            throw new RuntimeException("Failed to parse Groq response: " + e.getMessage(), e);
        }
    }

    // ── Chat (free-text, no response_format) ──────────────────────

    /**
     * Sends a pre-built message array to Groq and returns the plain-text reply.
     * Used by ChatService which constructs the full system + history array.
     */
    public String chat(ArrayNode messages) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", TEXT_MODEL);
        body.put("temperature", 0.7); // slightly warmer for natural conversation
        body.set("messages", messages);

        try {
            return callGroq(objectMapper.writeValueAsString(body), "chat");
        } catch (Exception e) {
            throw new RuntimeException("Failed to send chat request: " + e.getMessage(), e);
        }
    }

    // ── Image analysis ─────────────────────────────────────────────

    public List<FoodAnalysisResult> analyzeImage(String imageBase64, String mimeType) {
        String requestBody;
        try {
            requestBody = buildImageRequestBody(imageBase64, mimeType);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build image request: " + e.getMessage(), e);
        }

        log.info("Calling Groq (vision) for uploaded image ({})", mimeType);
        String content = callGroq(requestBody, "image");

        try {
            // Vision models may wrap output in markdown fences — strip before parsing
            String json = extractJsonObject(content);
            JsonNode items = objectMapper.readTree(json).path("items");
            List<FoodAnalysisResult> results =
                    objectMapper.convertValue(items, new TypeReference<List<FoodAnalysisResult>>() {});
            log.info("Returning {} items from image analysis", results.size());
            return results;
        } catch (Exception e) {
            log.error("Failed to parse Groq vision response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse Groq response: " + e.getMessage(), e);
        }
    }

    // ── Shared HTTP call ───────────────────────────────────────────

    private String callGroq(String requestBody, String label) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(
                    GROQ_URL, HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    String.class);
        } catch (HttpClientErrorException e) {
            log.error("Groq API error {} for '{}': {}", e.getStatusCode(), label, e.getResponseBodyAsString());
            throw new RuntimeException("Food analysis failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Groq API call failed for '{}': {}", label, e.getMessage());
            throw new RuntimeException("Food analysis failed: " + e.getMessage(), e);
        }

        log.info("Groq responded {} for '{}'", response.getStatusCode(), label);

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                log.error("Groq response has no choices: {}", response.getBody());
                throw new RuntimeException("Groq returned no choices");
            }
            String content = choices.get(0).path("message").path("content").asText();
            log.info("Groq raw result: {}",
                    content.length() > 300 ? content.substring(0, 300) + "…" : content);
            return content;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to read Groq response: " + e.getMessage(), e);
        }
    }

    // ── Request builders ───────────────────────────────────────────

    /** Text request using json_object response_format for guaranteed clean output */
    private String buildTextRequestBody(String query) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", TEXT_MODEL);
        root.put("temperature", 0.0);
        root.set("response_format", objectMapper.createObjectNode().put("type", "json_object"));

        ArrayNode messages = objectMapper.createArrayNode();
        messages.add(objectMapper.createObjectNode()
                .put("role", "system").put("content", TEXT_SYSTEM_PROMPT));
        messages.add(objectMapper.createObjectNode()
                .put("role", "user").put("content", query));
        root.set("messages", messages);
        return objectMapper.writeValueAsString(root);
    }

    /** Vision request — multi-modal content with base64 image + text prompt */
    private String buildImageRequestBody(String imageBase64, String mimeType) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", VISION_MODEL);
        root.put("temperature", 0.0);

        ArrayNode messages = objectMapper.createArrayNode();

        // System message
        messages.add(objectMapper.createObjectNode()
                .put("role", "system").put("content", IMAGE_SYSTEM_PROMPT));

        // User message: image + brief trigger text
        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        ArrayNode content = objectMapper.createArrayNode();

        ObjectNode imageContent = objectMapper.createObjectNode();
        imageContent.put("type", "image_url");
        ObjectNode imageUrl = objectMapper.createObjectNode();
        imageUrl.put("url", "data:" + mimeType + ";base64," + imageBase64);
        imageContent.set("image_url", imageUrl);
        content.add(imageContent);

        content.add(objectMapper.createObjectNode()
                .put("type", "text")
                .put("text", "Identify all foods in this image and return the JSON."));

        userMsg.set("content", content);
        messages.add(userMsg);
        root.set("messages", messages);
        return objectMapper.writeValueAsString(root);
    }

    // ── Helpers ────────────────────────────────────────────────────

    /** Strip markdown code fences and extract the outermost JSON object */
    private String extractJsonObject(String text) {
        String s = text.trim();
        // Remove ```json ... ``` or ``` ... ``` wrappers
        if (s.startsWith("```")) {
            int newline = s.indexOf('\n');
            if (newline != -1) s = s.substring(newline + 1).trim();
            if (s.endsWith("```")) s = s.substring(0, s.lastIndexOf("```")).trim();
        }
        // Find the outermost { ... } in case there is any surrounding text
        int start = s.indexOf('{');
        int end   = s.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return s.substring(start, end + 1);
        }
        return s;
    }
}
