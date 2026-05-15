package com.fitai.dto.response;

public class ChatResponse {

    private String reply;

    public ChatResponse(String reply) {
        this.reply = reply;
    }

    public String getReply() { return reply; }
}
