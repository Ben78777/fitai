package com.fitai.service;

import com.fitai.dto.request.CreateLogEntryRequest;
import com.fitai.dto.response.LogEntryResponse;
import com.fitai.model.MealEntry;
import com.fitai.repository.MealEntryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LogService {

    private final MealEntryRepository repository;

    public LogService(MealEntryRepository repository) {
        this.repository = repository;
    }

    public List<LogEntryResponse> getEntriesForDay(String userId, LocalDate date) {
        return repository.findByUserIdAndDateOrderByCreatedAtAsc(userId, date)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public LogEntryResponse addEntry(String userId, CreateLogEntryRequest request) {
        MealEntry entry = new MealEntry();
        entry.setUserId(userId);
        entry.setDate(request.getDate());
        entry.setMealType(request.getMealType());
        entry.setFoodName(request.getFoodName());
        entry.setQuantityG(request.getQuantityG());
        entry.setCalories(request.getCalories());
        entry.setProteinG(request.getProteinG());
        entry.setCarbsG(request.getCarbsG());
        entry.setFatG(request.getFatG());

        MealEntry saved = repository.save(entry);
        return toResponse(saved);
    }

    public void removeEntry(String userId, UUID entryId) {
        // Verify ownership before deletion — prevents users from deleting others' entries
        MealEntry entry = repository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));

        repository.delete(entry);
    }

    private LogEntryResponse toResponse(MealEntry entry) {
        return new LogEntryResponse(
                entry.getId(),
                entry.getMealType(),
                entry.getFoodName(),
                entry.getQuantityG(),
                entry.getCalories(),
                entry.getProteinG(),
                entry.getCarbsG(),
                entry.getFatG()
        );
    }
}
