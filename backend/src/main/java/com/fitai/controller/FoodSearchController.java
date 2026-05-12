package com.fitai.controller;

import com.fitai.dto.response.FoodSearchResult;
import com.fitai.service.FoodSearchService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/food")
public class FoodSearchController {

    private final FoodSearchService foodSearchService;

    public FoodSearchController(FoodSearchService foodSearchService) {
        this.foodSearchService = foodSearchService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<FoodSearchResult>> search(@RequestParam String q) {
        try {
            List<FoodSearchResult> results = foodSearchService.search(q);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            // Upstream failure (bad API key, network, etc.) — tell the frontend explicitly
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
