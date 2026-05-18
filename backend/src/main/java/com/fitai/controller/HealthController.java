package com.fitai.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Liveness probe — no auth required.
 * GET /health          →  {"status":"ok","build":"..."}
 * GET /api/v1/health   →  same  (for uptime monitoring tools)
 */
@RestController
public class HealthController {

    // Bumped on each deploy to confirm the new code is running.
    private static final String BUILD = "2026-05-18-v4";

    @GetMapping({"/health", "/api/v1/health"})
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "build", BUILD));
    }
}
