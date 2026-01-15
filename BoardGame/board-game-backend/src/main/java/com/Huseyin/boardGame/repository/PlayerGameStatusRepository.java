package com.Huseyin.boardGame.repository;

import com.Huseyin.boardGame.model.PlayerGameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PlayerGameStatusRepository extends JpaRepository<PlayerGameStatus, Long> {

    long countByGame_Id(Long gameId);

    boolean existsByGame_IdAndPlayer_Id(Long gameId, Long playerId);

    List<PlayerGameStatus> findByGame_Id(Long gameId);

    List<PlayerGameStatus> findByGame_IdOrderByIdAsc(Long gameId);

    Optional<PlayerGameStatus> findByGame_IdAndPlayer_Id(Long gameId, Long playerId);

    // ✅ cleanup (JPQL deletes are very reliable + fast)
    @Modifying
    @Transactional
    @Query("delete from PlayerGameStatus p where p.game.id = :gameId")
    void deleteByGameId(@Param("gameId") Long gameId);

    @Modifying
    @Transactional
    @Query("delete from PlayerGameStatus p where p.player.id = :playerId")
    void deleteByPlayerId(@Param("playerId") Long playerId);
}
