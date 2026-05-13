package com.fitai.controller;

import com.fitai.dto.response.FoodSearchResult;
import com.fitai.service.OpenFoodFactsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/food")
public class FoodSearchController {

    private final OpenFoodFactsService openFoodFactsService;

    public FoodSearchController(OpenFoodFactsService openFoodFactsService) {
        this.openFoodFactsService = openFoodFactsService;
    }

    /**
     * Search the Open Food Facts database by food name.
     * Returns per-100g nutrition so the frontend can scale to any quantity.
     */
    @GetMapping("/search")
    public ResponseEntity<List<FoodSearchResult>> search(@RequestParam String q) {
        try {
            return ResponseEntity.ok(openFoodFactsService.search(q));
        } catch (Exception e) {
            // Upstream failure (network, parse error) — tell the frontend explicitly
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
