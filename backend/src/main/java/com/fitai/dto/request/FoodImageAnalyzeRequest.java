package com.fitai.dto.request;

import jakarta.validation.constraints.NotBlank;

public class FoodImageAnalyzeRequest {

    @NotBlank(message = "imageBase64 must not be blank")
    private String imageBase64;

    @NotBlank(message = "mimeType must not be blank")
    private String mimeType; // e.g. "image/jpeg", "image/png"

    public FoodImageAnalyzeRequest() {}

    public String getImageBase64() { return imageBase64; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
}
