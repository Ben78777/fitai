package com.fitai.controller;

import com.fitai.dto.request.CreateWeightLogRequest;
import com.fitai.dto.response.WeightLogResponse;
import com.fitai.service.WeightLogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/weight")
public class WeightLogController {

    private final WeightLogService weightLogService;

    public WeightLogController(WeightLogService weightLogService) {
        this.weightLogService = weightLogService;
    }

    /** POST /api/v1/weight — log today's weight */
    @PostMapping
    public ResponseEntity<WeightLogResponse> logWeight(
            Authentication auth,
            @Valid @RequestBody CreateWeightLogRequest request) {

        // Principal is the raw userId String set by SupabaseJwtFilter — not a UserDetails object
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(weightLogService.logWeight(userId, request));
    }

    /** GET /api/v1/weight — all weight entries, oldest-first */
    @GetMapping
    public ResponseEntity<List<WeightLogResponse>> getAllLogs(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(weightLogService.getAllLogs(userId));
    }

    /** GET /api/v1/weight/latest — most recent entry (pre-fills the modal) */
    @GetMapping("/latest")
    public ResponseEntity<?> getLatest(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return weightLogService.getLatestLog(userId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(Map.of())); // empty object when no log exists
    }

    /** GET /api/v1/weight/nudge — true if user hasn't logged in 7+ days */
    @GetMapping("/nudge")
    public ResponseEntity<Map<String, Boolean>> nudge(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("showNudge", weightLogService.needsWeightNudge(userId)));
    }
}
