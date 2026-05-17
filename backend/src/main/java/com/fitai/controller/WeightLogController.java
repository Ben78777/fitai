package com.fitai.controller;

import com.fitai.dto.request.CreateWeightLogRequest;
import com.fitai.dto.response.WeightLogResponse;
import com.fitai.service.WeightLogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CreateWeightLogRequest request) {

        WeightLogResponse saved = weightLogService.logWeight(user.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** GET /api/v1/weight — all weight entries, oldest-first */
    @GetMapping
    public ResponseEntity<List<WeightLogResponse>> getAllLogs(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(weightLogService.getAllLogs(user.getUsername()));
    }

    /** GET /api/v1/weight/latest — most recent entry (pre-fills the modal) */
    @GetMapping("/latest")
    public ResponseEntity<?> getLatest(
            @AuthenticationPrincipal UserDetails user) {

        return weightLogService.getLatestLog(user.getUsername())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(Map.of())); // empty object when no log exists
    }

    /** GET /api/v1/weight/nudge — true if user hasn't logged in 7+ days */
    @GetMapping("/nudge")
    public ResponseEntity<Map<String, Boolean>> nudge(
            @AuthenticationPrincipal UserDetails user) {

        boolean needs = weightLogService.needsWeightNudge(user.getUsername());
        return ResponseEntity.ok(Map.of("showNudge", needs));
    }
}
