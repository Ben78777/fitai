package com.fitai.controller;

import com.fitai.dto.request.CreateLogEntryRequest;
import com.fitai.dto.response.LogEntryResponse;
import com.fitai.service.LogService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/log")
public class LogController {

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping
    public ResponseEntity<List<LogEntryResponse>> getLog(
            Authentication auth,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        String userId = (String) auth.getPrincipal();
        List<LogEntryResponse> entries = logService.getEntriesForDay(userId, date);
        return ResponseEntity.ok(entries);
    }

    @PostMapping
    public ResponseEntity<LogEntryResponse> addEntry(
            Authentication auth,
            @Valid @RequestBody CreateLogEntryRequest request) {

        String userId = (String) auth.getPrincipal();
        LogEntryResponse created = logService.addEntry(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeEntry(
            Authentication auth,
            @PathVariable UUID id) {

        String userId = (String) auth.getPrincipal();
        logService.removeEntry(userId, id);
        return ResponseEntity.noContent().build();
    }
}
