package com.Huseyin.boardGame.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "player_game_status",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_game_player", columnNames = {"game_id", "player_id"})
        },
        indexes = {
                @Index(name = "idx_pgs_game", columnList = "game_id"),
                @Index(name = "idx_pgs_player", columnList = "player_id")
        }
)
public class PlayerGameStatus {

    // ✅ Must match Board.jsx tilesPerPlayer = 17
    public static final int MAX_TILES = 17;
    public static final int LAST_INDEX = MAX_TILES - 1; // 16

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // PK

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    private User player;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(name = "is_blocked", nullable = false)
    private boolean blocked = false;

    @Column(name = "has_shield", nullable = false)
    private boolean hasShield = false;

    @Column(name = "question_multiplier", nullable = false)
    private int questionMultiplier = 1;

    // token position on board (0..LAST_INDEX)
    @Column(name = "position", nullable = false)
    private int position = 0;

    public PlayerGameStatus() {}

    public PlayerGameStatus(User player, Game game) {
        this.player = player;
        this.game = game;
        this.blocked = false;
        this.hasShield = false;
        this.questionMultiplier = 1;
        this.position = 0;
    }

    // =========================
    // ✅ Exact landing helpers
    // =========================

    /** True if moving by delta would land on or before LAST_INDEX (no overshoot). */
    public boolean canMoveBy(int delta) {
        int target = this.position + delta;
        return target >= 0 && target <= LAST_INDEX;
    }

    /**
     * ✅ Move only if it does NOT overshoot.
     * If overshoot happens, position stays the same.
     * If target < 0 => snap to 0.
     */
    public void moveByExact(int delta) {
        int target = this.position + delta;

        if (target < 0) {
            this.position = 0;
            return;
        }

        if (target <= LAST_INDEX) {
            this.position = target;
        }
        // else overshoot => NO MOVE
    }

    /** True if player is exactly at finish tile. */
    public boolean isAtFinish() {
        return this.position == LAST_INDEX;
    }

    // ===== getters & setters =====

    public Long getId() {
        return id;
    }

    public User getPlayer() {
        return player;
    }

    public void setPlayer(User player) {
        this.player = player;
    }

    public Game getGame() {
        return game;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }

    // keep your original naming style
    public boolean isHasShield() {
        return hasShield;
    }

    public void setHasShield(boolean hasShield) {
        this.hasShield = hasShield;
    }

    public int getQuestionMultiplier() {
        return questionMultiplier;
    }

    public void setQuestionMultiplier(int questionMultiplier) {
        this.questionMultiplier = Math.max(1, questionMultiplier);
    }

    public int getPosition() {
        return position;
    }

    /**
     * ✅ IMPORTANT:
     * - position < 0 => 0
     * - position > LAST_INDEX => IGNORE (exact landing rule; no clamp-to-win)
     */
    public void setPosition(int position) {
        if (position < 0) {
            this.position = 0;
        } else if (position > LAST_INDEX) {
            // overshoot attempt => ignore
        } else {
            this.position = position;
        }
    }
}
