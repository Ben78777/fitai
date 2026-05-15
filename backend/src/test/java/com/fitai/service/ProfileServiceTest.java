package com.fitai.service;

import com.fitai.dto.request.CreateProfileRequest;
import com.fitai.dto.response.UserProfileResponse;
import com.fitai.model.UserProfile;
import com.fitai.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private UserProfileRepository repository;

    @InjectMocks
    private ProfileService service;

    private UserProfile sampleProfile(String userId) {
        UserProfile p = new UserProfile();
        p.setId(UUID.randomUUID());
        p.setUserId(userId);
        p.setName("Alice");
        p.setGender("female");
        p.setAge(28);
        p.setWeightKg(new BigDecimal("62.5"));
        p.setHeightCm(new BigDecimal("168.0"));
        p.setGoal("cutting");
        p.setCalorieTargetOffset(500);
        return p;
    }

    @Test
    void getProfile_returnsDto_whenProfileExists() {
        when(repository.findByUserId("user-1")).thenReturn(Optional.of(sampleProfile("user-1")));

        UserProfileResponse response = service.getProfile("user-1");

        assertThat(response.getName()).isEqualTo("Alice");
        assertThat(response.getGoal()).isEqualTo("cutting");
        assertThat(response.getCalorieTargetOffset()).isEqualTo(500);
    }

    @Test
    void getProfile_throws404_whenProfileNotFound() {
        when(repository.findByUserId("user-2")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProfile("user-2"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void createProfile_savesAndReturnsDto() {
        when(repository.findByUserId("user-3")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> {
            UserProfile p = inv.getArgument(0);
            p.setId(UUID.randomUUID()); // simulate DB-generated ID
            return p;
        });

        CreateProfileRequest req = new CreateProfileRequest();
        req.setName("Bob");
        req.setGender("male");
        req.setAge(30);
        req.setWeightKg(new BigDecimal("80.0"));
        req.setHeightCm(new BigDecimal("180.0"));
        req.setGoal("bulking");
        req.setCalorieTargetOffset(300);

        UserProfileResponse response = service.createProfile("user-3", req);

        assertThat(response.getName()).isEqualTo("Bob");
        assertThat(response.getGoal()).isEqualTo("bulking");
        assertThat(response.getCalorieTargetOffset()).isEqualTo(300);
    }

    @Test
    void createProfile_defaultsCalorieOffsetTo500_whenNotProvided() {
        when(repository.findByUserId("user-4")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> {
            UserProfile p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        CreateProfileRequest req = new CreateProfileRequest();
        req.setName("Carol");
        req.setGender("female");
        req.setAge(25);
        req.setWeightKg(new BigDecimal("55.0"));
        req.setHeightCm(new BigDecimal("160.0"));
        req.setGoal("maintenance");
        // calorieTargetOffset intentionally not set

        UserProfileResponse response = service.createProfile("user-4", req);

        assertThat(response.getCalorieTargetOffset()).isEqualTo(500);
    }

    @Test
    void createProfile_throws409_whenProfileAlreadyExists() {
        when(repository.findByUserId("user-5")).thenReturn(Optional.of(sampleProfile("user-5")));

        CreateProfileRequest req = new CreateProfileRequest();
        req.setName("Dave");
        req.setGender("male");
        req.setAge(35);
        req.setWeightKg(new BigDecimal("90.0"));
        req.setHeightCm(new BigDecimal("185.0"));
        req.setGoal("cutting");

        assertThatThrownBy(() -> service.createProfile("user-5", req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }
}
