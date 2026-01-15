package com.Huseyin.boardGame.model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "games")
public class Game {

    public enum Status {
        ACTIVE,
        FINISHED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100)
    private String name;

    // ✅ legacy field you already use (you can keep it)
    @Column(name = "current_turn")
    private Integer currentTurn;

    // ✅ Phase 2: server authoritative turn slot (1..4)
    @Column(name = "current_turn_slot")
    private Integer currentTurnSlot = 1;

    // ✅ Phase 2: current question id for this game turn
    @Column(name = "current_question_id")
    private Long currentQuestionId;

    // ✅ Phase 2: when this turn ends (epoch millis)
    @Column(name = "turn_ends_at")
    private Long turnEndsAt;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds = 300;

    // ✅ Winner fields
    @Column(name = "winner_user_id")
    private Long winnerUserId;

    @Column(name = "winner_username", length = 50)
    private String winnerUsername;

    // ✅ When game finished (epoch millis)
    @Column(name = "finished_at")
    private Long finishedAt;

    @ManyToMany
    @JoinTable(
            name = "game_questions",
            joinColumns = @JoinColumn(name = "game_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    private Set<Question> questions = new HashSet<>();

    public Game() {}

    public Game(String name) {
        this.name = name;
        this.currentTurn = 1;        // legacy
        this.currentTurnSlot = 1;    // Phase 2
        this.status = Status.ACTIVE;

        // ✅ winner defaults
        this.winnerUserId = null;
        this.winnerUsername = null;
        this.finishedAt = null;
    }

    // ====== getters & setters ======

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getCurrentTurn() {
        return currentTurn;
    }

    public void setCurrentTurn(Integer currentTurn) {
        this.currentTurn = currentTurn;
    }

    public Integer getCurrentTurnSlot() {
        return currentTurnSlot;
    }

    public void setCurrentTurnSlot(Integer currentTurnSlot) {
        this.currentTurnSlot = currentTurnSlot;
    }

    public Long getCurrentQuestionId() {
        return currentQuestionId;
    }

    public void setCurrentQuestionId(Long currentQuestionId) {
        this.currentQuestionId = currentQuestionId;
    }

    public Long getTurnEndsAt() {
        return turnEndsAt;
    }

    public void setTurnEndsAt(Long turnEndsAt) {
        this.turnEndsAt = turnEndsAt;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Integer getTimeLimitSeconds() {
        return timeLimitSeconds;
    }

    public void setTimeLimitSeconds(Integer timeLimitSeconds) {
        this.timeLimitSeconds = timeLimitSeconds;
    }

    // ✅ Winner getters/setters
    public Long getWinnerUserId() {
        return winnerUserId;
    }

    public void setWinnerUserId(Long winnerUserId) {
        this.winnerUserId = winnerUserId;
    }

    public String getWinnerUsername() {
        return winnerUsername;
    }

    public void setWinnerUsername(String winnerUsername) {
        this.winnerUsername = winnerUsername;
    }

    public Long getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Long finishedAt) {
        this.finishedAt = finishedAt;
    }

    public Set<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(Set<Question> questions) {
        this.questions = questions;
    }
}
