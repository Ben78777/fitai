package com.fitai.controller;

import com.fitai.dto.response.ProgressResponse;
import com.fitai.service.ProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    public ResponseEntity<ProgressResponse> getProgress(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(progressService.getProgress(userId));
    }
}
