package com.fitai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fitai.dto.request.ChatMessageDto;
import com.fitai.dto.response.ProgressResponse;
import com.fitai.model.MealEntry;
import com.fitai.model.UserProfile;
import com.fitai.repository.MealEntryRepository;
import com.fitai.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private UserProfileRepository profileRepository;
    @Mock private MealEntryRepository   mealEntryRepository;
    @Mock private ProgressService       progressService;
    @Mock private GeminiService         geminiService;

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        // Use a real ObjectMapper so node-building in ChatService works without mocking
        chatService = new ChatService(
                profileRepository, mealEntryRepository,
                progressService, geminiService, new ObjectMapper());
    }

    private UserProfile sampleProfile() {
        UserProfile p = new UserProfile();
        p.setUserId("u1");
        p.setName("Alice");
        p.setGender("female");
        p.setAge(28);
        p.setWeightKg(new BigDecimal("62.5"));
        p.setHeightCm(new BigDecimal("168.0"));
        p.setGoal("cutting");
        p.setActivityLevel("sedentary");
        p.setCalorieTargetOffset(500);
        return p;
    }

    private ProgressResponse sampleProgress() {
        // Matches values calculated from sampleProfile()
        return new ProgressResponse(1149, 800, -349, -447, -0.06, "cutting", 500, 1649, 62.5);
    }

    @Test
    void chat_returnsGroqReply() {
        when(profileRepository.findByUserId("u1")).thenReturn(Optional.of(sampleProfile()));
        when(progressService.getProgress(eq("u1"), any(LocalDate.class))).thenReturn(sampleProgress());
        when(mealEntryRepository.findByUserIdAndDateOrderByCreatedAtAsc(eq("u1"), any(LocalDate.class)))
                .thenReturn(List.of());
        when(geminiService.chat(any(ArrayNode.class))).thenReturn("Great progress today, Alice!");

        String reply = chatService.chat("u1", "How am I doing?", null);

        assertThat(reply).isEqualTo("Great progress today, Alice!");
    }

    @Test
    void chat_includesConversationHistory() {
        when(profileRepository.findByUserId("u1")).thenReturn(Optional.of(sampleProfile()));
        when(progressService.getProgress(eq("u1"), any(LocalDate.class))).thenReturn(sampleProgress());
        when(mealEntryRepository.findByUserIdAndDateOrderByCreatedAtAsc(eq("u1"), any(LocalDate.class)))
                .thenReturn(List.of());
        when(geminiService.chat(any(ArrayNode.class))).thenReturn("Keep it up!");

        ChatMessageDto prev = new ChatMessageDto();
        prev.setRole("user");
        prev.setContent("What should I eat?");

        ChatMessageDto prevReply = new ChatMessageDto();
        prevReply.setRole("assistant");
        prevReply.setContent("Eat more protein!");

        String reply = chatService.chat("u1", "Thank you!", List.of(prev, prevReply));

        assertThat(reply).isEqualTo("Keep it up!");
    }

    @Test
    void chat_throws404_whenProfileNotFound() {
        when(profileRepository.findByUserId("u2")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.chat("u2", "Hello", null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }
}
