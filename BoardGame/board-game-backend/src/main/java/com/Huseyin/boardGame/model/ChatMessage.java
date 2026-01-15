package com.Huseyin.boardGame.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "chat_message",
        indexes = {
                @Index(name = "idx_chat_game_id", columnList = "game_id"),
                @Index(name = "idx_chat_game_id_id", columnList = "game_id, id")
        }
)
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "text", nullable = false, length = 280)
    private String text;

    // store epoch millis (easy for frontend)
    @Column(name = "created_at", nullable = false)
    private Long createdAt;

    public ChatMessage() {}

    public ChatMessage(Game game, User user, String text, Long createdAt) {
        this.game = game;
        this.user = user;
        this.text = text;
        this.createdAt = (createdAt != null ? createdAt : Instant.now().toEpochMilli());
    }

    public Long getId() { return id; }
    public Game getGame() { return game; }
    public User getUser() { return user; }
    public String getText() { return text; }
    public Long getCreatedAt() { return createdAt; }

    public void setGame(Game game) { this.game = game; }
    public void setUser(User user) { this.user = user; }
    public void setText(String text) { this.text = text; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
}
