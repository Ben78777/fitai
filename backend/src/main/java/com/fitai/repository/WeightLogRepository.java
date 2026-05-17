package com.fitai.repository;

import com.fitai.model.WeightLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeightLogRepository extends JpaRepository<WeightLog, UUID> {

    // All logs for a user, oldest-first (for charting)
    List<WeightLog> findByUserIdOrderByLoggedAtAsc(String userId);

    // All logs since a given date (inclusive), oldest-first
    List<WeightLog> findByUserIdAndLoggedAtGreaterThanEqualOrderByLoggedAtAsc(
            String userId, LocalDate from);

    // Most recent log entry — used to pre-fill the weight modal
    Optional<WeightLog> findTopByUserIdOrderByLoggedAtDesc(String userId);

    // Check if the user has logged weight recently (for the nudge banner)
    @Query("SELECT COUNT(w) > 0 FROM WeightLog w WHERE w.userId = :userId AND w.loggedAt >= :since")
    boolean existsByUserIdAndLoggedAtGreaterThanEqual(@Param("userId") String userId,
                                                      @Param("since") LocalDate since);
}
