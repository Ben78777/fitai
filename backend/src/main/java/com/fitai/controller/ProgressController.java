package com.fitai.controller;

import com.fitai.dto.response.ProgressResponse;
import com.fitai.service.ProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    /**
     * Returns progress stats for the given date (defaults to today).
     * Accumulated / all-time stats always span all days regardless of date param.
     */
    @GetMapping
    public ResponseEntity<ProgressResponse> getProgress(
            Authentication auth,
            @RequestParam(required = false) String date) {

        String userId = (String) auth.getPrincipal();

        // Parse the requested date — default to today if not provided or invalid
        LocalDate queryDate = LocalDate.now();
        if (date != null && !date.isBlank()) {
            try {
                queryDate = LocalDate.parse(date);
            } catch (DateTimeParseException ignored) {
                // Treat malformed dates as "today" rather than returning 400
            }
        }

        return ResponseEntity.ok(progressService.getProgress(userId, queryDate));
    }
}
