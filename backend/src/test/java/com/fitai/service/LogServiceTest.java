package com.fitai.service;

import com.fitai.dto.request.CreateLogEntryRequest;
import com.fitai.dto.response.LogEntryResponse;
import com.fitai.model.MealEntry;
import com.fitai.repository.MealEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LogServiceTest {

    @Mock
    private MealEntryRepository repository;

    @InjectMocks
    private LogService logService;

    private static final String USER_ID = "user-123";
    private static final LocalDate TODAY = LocalDate.of(2026, 5, 10);

    private MealEntry sampleEntry() {
        MealEntry e = new MealEntry();
        e.setId(UUID.randomUUID());
        e.setUserId(USER_ID);
        e.setDate(TODAY);
        e.setMealType("breakfast");
        e.setFoodName("Banana");
        e.setQuantityG(new BigDecimal("120"));
        e.setCalories(new BigDecimal("106.8"));
        e.setProteinG(new BigDecimal("1.3"));
        e.setCarbsG(new BigDecimal("27.6"));
        e.setFatG(new BigDecimal("0.4"));
        return e;
    }

    @Test
    void getEntriesForDay_returnsAllEntriesForUser() {
        MealEntry entry = sampleEntry();
        when(repository.findByUserIdAndDateOrderByCreatedAtAsc(USER_ID, TODAY))
                .thenReturn(List.of(entry));

        List<LogEntryResponse> results = logService.getEntriesForDay(USER_ID, TODAY);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getFoodName()).isEqualTo("Banana");
        assertThat(results.get(0).getMealType()).isEqualTo("breakfast");
    }

    @Test
    void addEntry_savesEntryWithCorrectUserId() {
        CreateLogEntryRequest request = new CreateLogEntryRequest();
        request.setDate(TODAY);
        request.setMealType("lunch");
        request.setFoodName("Apple");
        request.setQuantityG(new BigDecimal("150"));
        request.setCalories(new BigDecimal("78.0"));
        request.setProteinG(new BigDecimal("0.4"));
        request.setCarbsG(new BigDecimal("20.6"));
        request.setFatG(new BigDecimal("0.2"));

        MealEntry saved = new MealEntry();
        saved.setId(UUID.randomUUID());
        saved.setUserId(USER_ID);
        saved.setDate(TODAY);
        saved.setMealType("lunch");
        saved.setFoodName("Apple");
        saved.setQuantityG(new BigDecimal("150"));
        saved.setCalories(new BigDecimal("78.0"));
        saved.setProteinG(new BigDecimal("0.4"));
        saved.setCarbsG(new BigDecimal("20.6"));
        saved.setFatG(new BigDecimal("0.2"));

        when(repository.save(any(MealEntry.class))).thenReturn(saved);

        LogEntryResponse response = logService.addEntry(USER_ID, request);

        assertThat(response.getFoodName()).isEqualTo("Apple");
        assertThat(response.getMealType()).isEqualTo("lunch");

        // Verify userId was set on the entity being saved
        verify(repository).save(argThat(e -> USER_ID.equals(e.getUserId())));
    }

    @Test
    void removeEntry_deletesWhenOwnershipMatches() {
        UUID entryId = UUID.randomUUID();
        MealEntry entry = sampleEntry();
        entry.setId(entryId);

        when(repository.findByIdAndUserId(entryId, USER_ID)).thenReturn(Optional.of(entry));

        logService.removeEntry(USER_ID, entryId);

        verify(repository).delete(entry);
    }

    @Test
    void removeEntry_throws404WhenEntryNotFoundOrWrongUser() {
        UUID entryId = UUID.randomUUID();
        when(repository.findByIdAndUserId(entryId, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> logService.removeEntry(USER_ID, entryId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("not found");
    }
}
