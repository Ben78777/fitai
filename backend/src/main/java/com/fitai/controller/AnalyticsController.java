package com.fitai.controller;

import com.fitai.dto.response.AnalyticsResponse;
import com.fitai.dto.response.PredictResponse;
import com.fitai.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * GET /api/v1/analytics?days=30
     * days=0 → all time; days=7/30/90 → last N days.
     */
    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            Authentication auth,
            @RequestParam(defaultValue = "30") int days) {

        // Principal is the raw userId String set by SupabaseJwtFilter — not a UserDetails object
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(analyticsService.getAnalytics(userId, days));
    }

    /**
     * POST /api/v1/predict?days=30
     * Returns current + projected weight datapoints.
     * days defaults to 30 (one-month horizon).
     */
    @PostMapping("/predict")
    public ResponseEntity<PredictResponse> predict(
            Authentication auth,
            @RequestParam(defaultValue = "30") int days) {

        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(analyticsService.predict(userId, days));
    }
}
