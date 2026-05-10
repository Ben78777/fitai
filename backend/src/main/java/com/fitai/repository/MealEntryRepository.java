package com.fitai.repository;

import com.fitai.model.MealEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
