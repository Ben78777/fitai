package com.fitai.dto.request;

public class ChatMessageDto {

    private String role;    // "user" | "assistant"
    private String content;

    public ChatMessageDto() {}

    public String getRole()    { return role; }
    public void setRole(String role) { this.role = role; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
