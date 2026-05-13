package com.fitai.controller;

import com.fitai.dto.request.FoodAnalyzeRequest;
import com.fitai.dto.response.FoodAnalysisResult;
import com.fitai.service.GeminiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/food")
public class FoodSearchController {

    private final GeminiService geminiService;

    public FoodSearchController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * Analyze any food query — single ingredient or a full meal description.
     * Gemini returns pre-calculated macros for each identified food item.
     */
    @PostMapping("/analyze")
    public ResponseEntity<List<FoodAnalysisResult>> analyze(
            @Valid @RequestBody FoodAnalyzeRequest request) {
        try {
            return ResponseEntity.ok(geminiService.analyze(request.getQuery()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
