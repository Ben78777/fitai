package com.fitai.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class ChatRequest {

    @NotBlank(message = "Message must not be blank")
    private String message;

    // Full conversation history sent from the frontend so Groq has context.
    // Null or empty on the first message.
    private List<ChatMessageDto> history;

    public ChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<ChatMessageDto> getHistory() { return history; }
    public void setHistory(List<ChatMessageDto> history) { this.history = history; }
}
