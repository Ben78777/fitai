package com.fitai.repository;

import com.fitai.model.MealEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MealEntryRepository extends JpaRepository<MealEntry, UUID> {

    // Fetch all entries for a given user on a specific date, ordered chronologically
    List<MealEntry> findByUserIdAndDateOrderByCreatedAtAsc(String userId, LocalDate date);

    // Used to verify ownership before deleting
    Optional<MealEntry> findByIdAndUserId(UUID id, String userId);

    // Sum calories for a single day — used to compute today's intake in progress
    @Query("SELECT SUM(e.calories) FROM MealEntry e WHERE e.userId = :userId AND e.date = :date")
    BigDecimal sumCaloriesForDay(@Param("userId") String userId, @Param("date") LocalDate date);

    // Sum calories across all time — numerator of accumulated surplus/deficit
    @Query("SELECT SUM(e.calories) FROM MealEntry e WHERE e.userId = :userId")
    BigDecimal sumAllCaloriesByUserId(@Param("userId") String userId);

    // Count distinct days that have at least one entry — denominator for accumulated calc
    @Query("SELECT COUNT(DISTINCT e.date) FROM MealEntry e WHERE e.userId = :userId")
    long countDistinctDatesWithEntries(@Param("userId") String userId);
}
