package com.Huseyin.boardGame.repository;

import com.Huseyin.boardGame.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByStatus(Game.Status status);

    // ✅ Delete join-table rows first
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM game_questions WHERE game_id = :gameId", nativeQuery = true)
    void deleteGameQuestions(@Param("gameId") Long gameId);
}
