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
        // Micronutrients — stored as-is (null when AI didn't return data)
        entry.setFiberG(request.getFiberG());
        entry.setSugarG(request.getSugarG());
        entry.setSodiumMg(request.getSodiumMg());
        entry.setPotassiumMg(request.getPotassiumMg());
        entry.setVitaminCMg(request.getVitaminCMg());
        entry.setVitaminDMcg(request.getVitaminDMcg());
        entry.setCalciumMg(request.getCalciumMg());
        entry.setIronMg(request.getIronMg());

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
        LogEntryResponse r = new LogEntryResponse();
        r.setId(entry.getId());
        r.setMealType(entry.getMealType());
        r.setFoodName(entry.getFoodName());
        r.setQuantityG(entry.getQuantityG());
        r.setCalories(entry.getCalories());
        r.setProteinG(entry.getProteinG());
        r.setCarbsG(entry.getCarbsG());
        r.setFatG(entry.getFatG());
        r.setFiberG(entry.getFiberG());
        r.setSugarG(entry.getSugarG());
        r.setSodiumMg(entry.getSodiumMg());
        r.setPotassiumMg(entry.getPotassiumMg());
        r.setVitaminCMg(entry.getVitaminCMg());
        r.setVitaminDMcg(entry.getVitaminDMcg());
        r.setCalciumMg(entry.getCalciumMg());
        r.setIronMg(entry.getIronMg());
        return r;
    }
}
