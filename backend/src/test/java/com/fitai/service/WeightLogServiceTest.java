package com.fitai.service;

import com.fitai.dto.request.CreateWeightLogRequest;
import com.fitai.dto.response.WeightLogResponse;
import com.fitai.model.WeightLog;
import com.fitai.repository.WeightLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeightLogServiceTest {

    @Mock private WeightLogRepository weightLogRepository;

    @InjectMocks
    private WeightLogService service;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private WeightLog makeLog(String userId, double kg, LocalDate date) {
        WeightLog log = new WeightLog();
        log.setId(UUID.randomUUID());
        log.setUserId(userId);
        log.setWeightKg(BigDecimal.valueOf(kg));
        log.setLoggedAt(date);
        return log;
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    void logWeight_savesEntryWithTodayDate() {
        CreateWeightLogRequest req = new CreateWeightLogRequest();
        req.setWeightKg(BigDecimal.valueOf(75.5));

        WeightLog saved = makeLog("user1", 75.5, LocalDate.now());
        when(weightLogRepository.save(any(WeightLog.class))).thenReturn(saved);

        WeightLogResponse response = service.logWeight("user1", req);

        // Verify the entity that was persisted has today's date and correct weight
        ArgumentCaptor<WeightLog> captor = ArgumentCaptor.forClass(WeightLog.class);
        verify(weightLogRepository).save(captor.capture());
        WeightLog persisted = captor.getValue();

        assertThat(persisted.getUserId()).isEqualTo("user1");
        assertThat(persisted.getWeightKg()).isEqualByComparingTo("75.5");
        assertThat(persisted.getLoggedAt()).isEqualTo(LocalDate.now());

        assertThat(response.getWeightKg()).isEqualByComparingTo("75.5");
    }

    @Test
    void getAllLogs_returnsOrderedList() {
        List<WeightLog> logs = List.of(
                makeLog("user1", 80.0, LocalDate.of(2026, 5, 1)),
                makeLog("user1", 79.5, LocalDate.of(2026, 5, 8)),
                makeLog("user1", 79.0, LocalDate.of(2026, 5, 15))
        );
        when(weightLogRepository.findByUserIdOrderByLoggedAtAsc("user1")).thenReturn(logs);

        List<WeightLogResponse> result = service.getAllLogs("user1");

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getWeightKg()).isEqualByComparingTo("80.0");
        assertThat(result.get(2).getWeightKg()).isEqualByComparingTo("79.0");
    }

    @Test
    void getLatestLog_returnsEmptyWhenNoLogs() {
        when(weightLogRepository.findTopByUserIdOrderByLoggedAtDesc("user1")).thenReturn(Optional.empty());

        Optional<WeightLogResponse> result = service.getLatestLog("user1");

        assertThat(result).isEmpty();
    }

    @Test
    void getLatestLog_returnsMostRecentEntry() {
        WeightLog log = makeLog("user1", 78.0, LocalDate.of(2026, 5, 15));
        when(weightLogRepository.findTopByUserIdOrderByLoggedAtDesc("user1")).thenReturn(Optional.of(log));

        Optional<WeightLogResponse> result = service.getLatestLog("user1");

        assertThat(result).isPresent();
        assertThat(result.get().getWeightKg()).isEqualByComparingTo("78.0");
        assertThat(result.get().getLoggedAt()).isEqualTo(LocalDate.of(2026, 5, 15));
    }

    @Test
    void needsWeightNudge_returnsTrueWhenNoRecentLog() {
        when(weightLogRepository.existsByUserIdAndLoggedAtGreaterThanEqual(eq("user1"), any(LocalDate.class)))
                .thenReturn(false);

        assertThat(service.needsWeightNudge("user1")).isTrue();
    }

    @Test
    void needsWeightNudge_returnsFalseWhenRecentLogExists() {
        when(weightLogRepository.existsByUserIdAndLoggedAtGreaterThanEqual(eq("user1"), any(LocalDate.class)))
                .thenReturn(true);

        assertThat(service.needsWeightNudge("user1")).isFalse();
    }
}
