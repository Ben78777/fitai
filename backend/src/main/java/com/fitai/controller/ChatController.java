package com.fitai.controller;

import com.fitai.dto.request.ChatRequest;
import com.fitai.dto.response.ChatResponse;
import com.fitai.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            Authentication auth,
            @Valid @RequestBody ChatRequest request) {
        String userId = (String) auth.getPrincipal();
        try {
            String reply = chatService.chat(userId, request.getMessage(), request.getHistory());
            return ResponseEntity.ok(new ChatResponse(reply));
        } catch (Exception e) {
            // Surface AI/network errors as 502 so the frontend can show a friendly message
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
