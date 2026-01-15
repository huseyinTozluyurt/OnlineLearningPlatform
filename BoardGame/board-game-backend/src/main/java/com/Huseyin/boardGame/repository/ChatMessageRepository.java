package com.Huseyin.boardGame.repository;

import com.Huseyin.boardGame.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Initial load: newest -> oldest (controller can reverse)
    @Query("""
        select m
        from ChatMessage m
        join fetch m.user u
        where m.game.id = :gameId
        order by m.id desc
    """)
    List<ChatMessage> findLatestWithUser(@Param("gameId") Long gameId, Pageable pageable);

    // Incremental load: messages after a given id (oldest -> newest)
    @Query("""
        select m
        from ChatMessage m
        join fetch m.user u
        where m.game.id = :gameId and m.id > :afterId
        order by m.id asc
    """)
    List<ChatMessage> findAfterWithUser(@Param("gameId") Long gameId,
                                        @Param("afterId") Long afterId,
                                        Pageable pageable);
}
