package com.fitai.controller;

import com.fitai.dto.request.FoodAnalyzeRequest;
import com.fitai.dto.request.FoodImageAnalyzeRequest;
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

    /** Analyze a free-text food query and return per-item macros. */
    @PostMapping("/analyze")
    public ResponseEntity<List<FoodAnalysisResult>> analyze(
            @Valid @RequestBody FoodAnalyzeRequest request) {
        try {
            return ResponseEntity.ok(geminiService.analyze(request.getQuery()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }

    /** Analyze a food photo and return per-item macros using a vision model. */
    @PostMapping("/analyze-image")
    public ResponseEntity<List<FoodAnalysisResult>> analyzeImage(
            @Valid @RequestBody FoodImageAnalyzeRequest request) {
        try {
            return ResponseEntity.ok(
                    geminiService.analyzeImage(request.getImageBase64(), request.getMimeType()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
