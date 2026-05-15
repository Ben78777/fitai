package com.fitai.service;

import com.fitai.dto.request.CreateProfileRequest;
import com.fitai.dto.request.UpdateProfileRequest;
import com.fitai.dto.response.UserProfileResponse;
import com.fitai.model.UserProfile;
import com.fitai.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileService {

    private final UserProfileRepository repository;

    public ProfileService(UserProfileRepository repository) {
        this.repository = repository;
    }

    /** Returns the profile for the given user, or 404 if none exists yet. */
    public UserProfileResponse getProfile(String userId) {
        UserProfile profile = repository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return toResponse(profile);
    }

    /** Creates a new profile during onboarding. Returns 409 if one already exists. */
    public UserProfileResponse createProfile(String userId, CreateProfileRequest request) {
        if (repository.findByUserId(userId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Profile already exists");
        }

        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        profile.setName(request.getName().trim());
        profile.setGender(request.getGender());
        profile.setAge(request.getAge());
        profile.setWeightKg(request.getWeightKg());
        profile.setHeightCm(request.getHeightCm());
        profile.setGoal(request.getGoal());
        profile.setActivityLevel(request.getActivityLevel());
        // Default offset to 500 when not provided (e.g. goal = "maintenance")
        profile.setCalorieTargetOffset(
                request.getCalorieTargetOffset() != null ? request.getCalorieTargetOffset() : 500
        );

        return toResponse(repository.save(profile));
    }

    /**
     * Partial update — applies only the non-null fields from the request.
     * Allows editing weight, age, goal, activity level, and calorie offset.
     */
    public UserProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        UserProfile profile = repository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

        if (request.getWeightKg() != null)          profile.setWeightKg(request.getWeightKg());
        if (request.getAge() != null)                profile.setAge(request.getAge());
        if (request.getGoal() != null)               profile.setGoal(request.getGoal());
        if (request.getActivityLevel() != null)      profile.setActivityLevel(request.getActivityLevel());
        if (request.getCalorieTargetOffset() != null) profile.setCalorieTargetOffset(request.getCalorieTargetOffset());

        return toResponse(repository.save(profile));
    }

    private UserProfileResponse toResponse(UserProfile p) {
        UserProfileResponse r = new UserProfileResponse();
        r.setId(p.getId().toString());
        r.setName(p.getName());
        r.setGender(p.getGender());
        r.setAge(p.getAge());
        r.setWeightKg(p.getWeightKg());
        r.setHeightCm(p.getHeightCm());
        r.setGoal(p.getGoal());
        r.setActivityLevel(p.getActivityLevel());
        r.setCalorieTargetOffset(p.getCalorieTargetOffset());
        return r;
    }
}
