package com.fitai.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class WeightLogResponse {

    private UUID id;
    private BigDecimal weightKg;
    private LocalDate loggedAt;

    public WeightLogResponse() {}

    public WeightLogResponse(UUID id, BigDecimal weightKg, LocalDate loggedAt) {
        this.id = id;
        this.weightKg = weightKg;
        this.loggedAt = loggedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public LocalDate getLoggedAt() { return loggedAt; }
    public void setLoggedAt(LocalDate loggedAt) { this.loggedAt = loggedAt; }
}
