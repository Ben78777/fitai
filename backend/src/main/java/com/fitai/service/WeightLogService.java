package com.fitai.service;

import com.fitai.dto.request.CreateWeightLogRequest;
import com.fitai.dto.response.WeightLogResponse;
import com.fitai.model.WeightLog;
import com.fitai.repository.WeightLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WeightLogService {

    private final WeightLogRepository weightLogRepository;

    public WeightLogService(WeightLogRepository weightLogRepository) {
        this.weightLogRepository = weightLogRepository;
    }

    /** Save today's weight for the user. One entry per day is the intended pattern. */
    public WeightLogResponse logWeight(String userId, CreateWeightLogRequest request) {
        WeightLog log = new WeightLog();
        log.setUserId(userId);
        log.setWeightKg(request.getWeightKg());
        log.setLoggedAt(LocalDate.now());

        WeightLog saved = weightLogRepository.save(log);
        return toResponse(saved);
    }

    /** All weight entries for a user, oldest-first. */
    public List<WeightLogResponse> getAllLogs(String userId) {
        return weightLogRepository.findByUserIdOrderByLoggedAtAsc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Most recent weight entry — used to pre-fill the log-weight modal. */
    public Optional<WeightLogResponse> getLatestLog(String userId) {
        return weightLogRepository.findTopByUserIdOrderByLoggedAtDesc(userId)
                .map(this::toResponse);
    }

    /**
     * Returns true when the user has NOT logged weight in the past 7 days.
     * The frontend uses this to decide whether to show the nudge banner.
     */
    public boolean needsWeightNudge(String userId) {
        LocalDate threshold = LocalDate.now().minusDays(7);
        Long count = weightLogRepository.countByUserIdSince(userId, threshold);
        return count == null || count == 0;
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private WeightLogResponse toResponse(WeightLog log) {
        return new WeightLogResponse(log.getId(), log.getWeightKg(), log.getLoggedAt());
    }
}
