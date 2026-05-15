package com.fitai.controller;

import com.fitai.dto.request.CreateProfileRequest;
import com.fitai.dto.response.UserProfileResponse;
import com.fitai.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /** Returns the current user's profile, or 404 if they haven't completed onboarding. */
    @GetMapping
    public ResponseEntity<UserProfileResponse> getProfile(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    /** Creates the profile during onboarding. */
    @PostMapping
    public ResponseEntity<UserProfileResponse> createProfile(
            Authentication auth,
            @Valid @RequestBody CreateProfileRequest request) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(profileService.createProfile(userId, request));
    }
}
