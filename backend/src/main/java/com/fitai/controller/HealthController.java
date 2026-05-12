package com.fitai.controller;

import com.fitai.service.FoodSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Liveness probe — no auth required.
 * GET /health  →  {"status":"ok","apiNinjasKeySet":true}
 * If apiNinjasKeySet is false the API_NINJAS_KEY env var is missing on Render.
 */
@RestController
public class HealthController {

    private final FoodSearchService foodSearchService;

    public HealthController(FoodSearchService foodSearchService) {
        this.foodSearchService = foodSearchService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "ok");
        body.put("apiNinjasKeySet", foodSearchService.isKeyConfigured());
        return ResponseEntity.ok(body);
    }
}
