package com.Huseyin.boardGame.controller;

import com.Huseyin.boardGame.model.Game;
import com.Huseyin.boardGame.model.PlayerGameStatus;
import com.Huseyin.boardGame.model.Question;
import com.Huseyin.boardGame.model.User;
import com.Huseyin.boardGame.repository.GameRepository;
import com.Huseyin.boardGame.repository.PlayerGameStatusRepository;
import com.Huseyin.boardGame.repository.QuestionRepository;
import com.Huseyin.boardGame.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameRepository gameRepository;
    private final PlayerGameStatusRepository playerStatusRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    public GameController(GameRepository gameRepository,
                          PlayerGameStatusRepository playerStatusRepository,
                          UserRepository userRepository,
                          QuestionRepository questionRepository) {
        this.gameRepository = gameRepository;
        this.playerStatusRepository = playerStatusRepository;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
    }

    // =========================
    // Helpers
    // =========================

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    private Game requireGame(Long gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found: " + gameId));
    }

    private boolean isUserInGame(Long gameId, Long userId) {
        return playerStatusRepository.existsByGame_IdAndPlayer_Id(gameId, userId);
    }

    private List<PlayerGameStatus> getStatusesSorted(Long gameId) {
        return playerStatusRepository.findByGame_IdOrderByIdAsc(gameId);
    }

    /** slot = join order (1..n) */
    private int slotOfUser(Long gameId, Long userId) {
        List<PlayerGameStatus> statuses = getStatusesSorted(gameId);
        for (int i = 0; i < statuses.size(); i++) {
            User u = statuses.get(i).getPlayer();
            if (u != null && Objects.equals(u.getId(), userId)) {
                return i + 1;
            }
        }
        return -1;
    }

    private List<Question> getGameQuestionsSorted(Game game) {
        List<Question> qs = new ArrayList<>(game.getQuestions() == null ? Set.of() : game.getQuestions());
        qs.sort(Comparator.comparing(Question::getId));
        return qs;
    }

    private Long pickFirstQuestionId(Game game) {
        List<Question> qs = getGameQuestionsSorted(game);
        return qs.isEmpty() ? null : qs.get(0).getId();
    }

    /** deterministic next question by id in sorted list */
    private Long pickNextQuestionId(Game game, Long currentQuestionId) {
        List<Question> qs = getGameQuestionsSorted(game);
        if (qs.isEmpty()) return null;
        if (currentQuestionId == null) return qs.get(0).getId();

        for (int i = 0; i < qs.size(); i++) {
            if (Objects.equals(qs.get(i).getId(), currentQuestionId)) {
                int nextIndex = (i + 1) % qs.size();
                return qs.get(nextIndex).getId();
            }
        }
        return qs.get(0).getId();
    }

    private long nowMs() {
        return System.currentTimeMillis();
    }

    private long computeTurnEndsAt(Game game) {
        int sec = (game.getTimeLimitSeconds() != null ? game.getTimeLimitSeconds() : 10);
        return nowMs() + (sec * 1000L);
    }

    private PlayerGameStatus requireStatus(Long gameId, Long userId) {
        return playerStatusRepository.findByGame_IdAndPlayer_Id(gameId, userId)
                .orElseThrow(() -> new RuntimeException("PlayerGameStatus not found"));
    }

    /** Find status by slot (join order slot = index+1) */
    private PlayerGameStatus statusBySlot(Long gameId, int slot) {
        List<PlayerGameStatus> statuses = getStatusesSorted(gameId);
        if (slot < 1 || slot > statuses.size()) return null;
        return statuses.get(slot - 1);
    }

    // =========================
    // ✅ Winner / Finish Helper
    // =========================

    /**
     * If actor is exactly at LAST_INDEX, mark game as FINISHED and store winner info.
     * Requires Game.java fields:
     * - winnerUserId, winnerUsername, finishedAt
     */
    private boolean finishIfWinner(Game game, PlayerGameStatus actor) {
        if (game == null || actor == null) return false;

        if (actor.isAtFinish()) {
            game.setStatus(Game.Status.FINISHED);

            if (actor.getPlayer() != null) {
                game.setWinnerUserId(actor.getPlayer().getId());
                game.setWinnerUsername(actor.getPlayer().getUsername());
            }

            // requires finishedAt in Game.java
            game.setFinishedAt(System.currentTimeMillis());

            game.setTurnEndsAt(null); // stop timer
            gameRepository.save(game);
            return true;
        }
        return false;
    }

    // =========================
    // ✅ Prize Cards (Phase 3)
    // =========================

    private enum CardCode {
        MOVE_2,
        MOVE_3,
        BLOCK_NEXT,
        SHIELD
    }

    public static class PrizeCard {
        public String code;
        public String title;
        public String description;
        public String icon;
        public Long targetUserId; // optional for BLOCK_NEXT

        public PrizeCard() {}

        public PrizeCard(CardCode code, String title, String description, String icon) {
            this.code = code.name();
            this.title = title;
            this.description = description;
            this.icon = icon;
        }
    }

    private PrizeCard drawRandomCard(Random rnd) {
        List<CardCode> pool = List.of(
                CardCode.MOVE_2,
                CardCode.MOVE_2,
                CardCode.MOVE_3,
                CardCode.BLOCK_NEXT,
                CardCode.SHIELD
        );
        CardCode pick = pool.get(rnd.nextInt(pool.size()));

        return switch (pick) {
            case MOVE_2 -> new PrizeCard(pick, "Warp Boost", "Move +2 tiles immediately", "🚀");
            case MOVE_3 -> new PrizeCard(pick, "Hyper Jump", "Move +3 tiles immediately", "🪐");
            case BLOCK_NEXT -> new PrizeCard(pick, "Meteor Trap", "Block the next player (skip their next turn)", "☄️");
            case SHIELD -> new PrizeCard(pick, "Cosmic Shield", "Gain a shield (cancels one block)", "🛡️");
        };
    }

    /** Apply card immediately (and persist) - ✅ exact landing enforced */
    private PrizeCard applyCard(Game game, PlayerGameStatus actor, PrizeCard card) {
        if (card == null || actor == null || game == null) return card;

        if (game.getStatus() == Game.Status.FINISHED) return card;

        CardCode code = CardCode.valueOf(card.code);

        switch (code) {
            case MOVE_2 -> {
                actor.moveByExact(2); // ✅ exact landing
                playerStatusRepository.save(actor);
                finishIfWinner(game, actor);
            }
            case MOVE_3 -> {
                actor.moveByExact(3); // ✅ exact landing
                playerStatusRepository.save(actor);
                finishIfWinner(game, actor);
            }
            case SHIELD -> {
                actor.setHasShield(true);
                playerStatusRepository.save(actor);
            }
            case BLOCK_NEXT -> {
                List<PlayerGameStatus> statuses = getStatusesSorted(game.getId());
                int n = statuses.size();
                if (n > 0) {
                    int active = (game.getCurrentTurnSlot() == null ? 1 : game.getCurrentTurnSlot());
                    int nextSlot = (active % n) + 1;

                    PlayerGameStatus target = statusBySlot(game.getId(), nextSlot);
                    if (target != null) {
                        target.setBlocked(true);
                        playerStatusRepository.save(target);
                        if (target.getPlayer() != null) card.targetUserId = target.getPlayer().getId();
                    }
                }
            }
        }

        return card;
    }

    // =========================
    // Turn handling
    // =========================

    private void advanceTurnToNextPlayer(Game game) {
        List<PlayerGameStatus> statuses = getStatusesSorted(game.getId());
        int n = statuses.size();
        if (n <= 0) return;

        int current = (game.getCurrentTurnSlot() == null || game.getCurrentTurnSlot() < 1)
                ? 1
                : game.getCurrentTurnSlot();

        int next = (current % n) + 1;
        game.setCurrentTurnSlot(next);
        game.setCurrentTurn(next); // legacy
    }

    private void advanceTurnSkippingBlocked(Game game) {
        List<PlayerGameStatus> statuses = getStatusesSorted(game.getId());
        int n = statuses.size();
        if (n <= 0) return;

        int slot = (game.getCurrentTurnSlot() == null || game.getCurrentTurnSlot() < 1)
                ? 1
                : game.getCurrentTurnSlot();

        for (int tries = 0; tries < n; tries++) {
            PlayerGameStatus st = statusBySlot(game.getId(), slot);
            if (st == null) break;

            if (st.isBlocked()) {
                if (st.isHasShield()) {
                    st.setHasShield(false);
                    st.setBlocked(false);
                    playerStatusRepository.save(st);

                    game.setCurrentTurnSlot(slot);
                    game.setCurrentTurn(slot);
                    return;
                } else {
                    st.setBlocked(false);
                    playerStatusRepository.save(st);

                    slot = (slot % n) + 1;
                    continue;
                }
            }

            game.setCurrentTurnSlot(slot);
            game.setCurrentTurn(slot);
            return;
        }

        game.setCurrentTurnSlot(1);
        game.setCurrentTurn(1);
    }

    /** If turn expired, advance automatically (ignore FINISHED games) */
    private void ensureNotExpired(Game game) {
        if (game.getStatus() == Game.Status.FINISHED) return;

        Long endsAt = game.getTurnEndsAt();
        if (endsAt != null && nowMs() >= endsAt) {
            advanceTurnToNextPlayer(game);
            advanceTurnSkippingBlocked(game);

            game.setCurrentQuestionId(pickNextQuestionId(game, game.getCurrentQuestionId()));
            game.setTurnEndsAt(computeTurnEndsAt(game));
            gameRepository.save(game);
        }
    }

    // =========================
    // DTOs
    // =========================

    public static class GameCreateRequest {
        private String name;
        private Integer timeLimitSeconds;
        private List<Long> questionIds;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Integer getTimeLimitSeconds() { return timeLimitSeconds; }
        public void setTimeLimitSeconds(Integer timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }

        public List<Long> getQuestionIds() { return questionIds; }
        public void setQuestionIds(List<Long> questionIds) { this.questionIds = questionIds; }
    }

    public static class GameUpdateRequest {
        private String name;
        private Integer timeLimitSeconds;
        private List<Long> questionIds;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Integer getTimeLimitSeconds() { return timeLimitSeconds; }
        public void setTimeLimitSeconds(Integer timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }

        public List<Long> getQuestionIds() { return questionIds; }
        public void setQuestionIds(List<Long> questionIds) { this.questionIds = questionIds; }
    }

    public static class AnswerRequest {
        private Long userId;
        private String answer;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }
    }

    public static class TimeoutRequest {
        private Long userId;
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
    }

    // =========================
    // ADMIN: CREATE ROOM
    // =========================

    @PostMapping
    public ResponseEntity<Game> createGame(@RequestBody GameCreateRequest req) {

        String name = (req.getName() != null && !req.getName().isBlank())
                ? req.getName()
                : "Room " + UUID.randomUUID().toString().substring(0, 6);

        Game game = new Game(name);

        if (req.getTimeLimitSeconds() != null) {
            game.setTimeLimitSeconds(req.getTimeLimitSeconds());
        }

        if (req.getQuestionIds() != null && !req.getQuestionIds().isEmpty()) {
            List<Question> questions = questionRepository.findAllById(req.getQuestionIds());
            game.setQuestions(new HashSet<>(questions));
        }

        // reset finish/winner info
        game.setWinnerUserId(null);
        game.setWinnerUsername(null);
        game.setFinishedAt(null);

        game.setCurrentTurnSlot(1);
        game.setCurrentTurn(1);
        game.setCurrentQuestionId(pickFirstQuestionId(game));
        game.setTurnEndsAt(null);

        Game saved = gameRepository.save(game);
        return ResponseEntity.ok(saved);
    }

    // =========================
    // ✅ ADMIN: UPDATE ROOM (EDIT)
    // =========================
    @Transactional
    @PutMapping("/{gameId}")
    public ResponseEntity<?> updateGame(@PathVariable Long gameId,
                                        @RequestBody GameUpdateRequest req) {

        if (!gameRepository.existsById(gameId)) {
            return ResponseEntity.notFound().build();
        }

        Game game = requireGame(gameId);

        if (req.getName() != null) {
            String trimmed = req.getName().trim();
            if (!trimmed.isEmpty()) {
                game.setName(trimmed);
            }
        }

        if (req.getTimeLimitSeconds() != null) {
            game.setTimeLimitSeconds(req.getTimeLimitSeconds());
        }

        if (req.getQuestionIds() != null) {
            List<Long> ids = req.getQuestionIds();
            List<Question> questions = questionRepository.findAllById(ids);

            if (questions.size() != ids.size()) {
                return ResponseEntity.badRequest().body("One or more questionIds not found");
            }

            gameRepository.deleteGameQuestions(gameId);
            game.setQuestions(new HashSet<>(questions));

            Long cur = game.getCurrentQuestionId();
            boolean curStillExists = (cur != null) && questions.stream().anyMatch(q -> q.getId().equals(cur));
            if (!curStillExists) {
                game.setCurrentQuestionId(pickFirstQuestionId(game));
            }
        }

        if (game.getTurnEndsAt() != null && game.getTimeLimitSeconds() != null && game.getStatus() == Game.Status.ACTIVE) {
            game.setTurnEndsAt(System.currentTimeMillis() + (game.getTimeLimitSeconds() * 1000L));
        }

        gameRepository.save(game);

        Map<String, Object> dto = new HashMap<>();
        dto.put("id", game.getId());
        dto.put("name", game.getName());
        dto.put("status", game.getStatus());
        dto.put("playerCount", playerStatusRepository.countByGame_Id(game.getId()));
        dto.put("questionCount", (game.getQuestions() == null) ? 0 : game.getQuestions().size());
        dto.put("timeLimitSeconds", game.getTimeLimitSeconds());
        dto.put("currentQuestionId", game.getCurrentQuestionId());
        dto.put("turnEndsAt", game.getTurnEndsAt());
        dto.put("currentTurnSlot", game.getCurrentTurnSlot());

        return ResponseEntity.ok(dto);
    }

    // =========================
    // ADMIN: LIST ROOMS WITH STATS
    // =========================

    @GetMapping
    public List<Map<String, Object>> getAllGames() {
        List<Game> games = gameRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Game g : games) {
            long playerCount = playerStatusRepository.countByGame_Id(g.getId());
            int questionCount = (g.getQuestions() == null) ? 0 : g.getQuestions().size();

            Map<String, Object> dto = new HashMap<>();
            dto.put("id", g.getId());
            dto.put("name", g.getName());
            dto.put("status", g.getStatus());
            dto.put("currentTurn", g.getCurrentTurn());
            dto.put("currentTurnSlot", g.getCurrentTurnSlot());
            dto.put("playerCount", playerCount);
            dto.put("questionCount", questionCount);
            dto.put("timeLimitSeconds", g.getTimeLimitSeconds());
            result.add(dto);
        }
        return result;
    }

    // =========================
    // PLAYER: LIST JOINABLE ROOMS
    // =========================

    @GetMapping("/open")
    public List<Map<String, Object>> getOpenGames() {
        List<Game> games = gameRepository.findByStatus(Game.Status.ACTIVE);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Game g : games) {
            long count = playerStatusRepository.countByGame_Id(g.getId());
            if (count < 4) {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", g.getId());
                dto.put("name", g.getName());
                dto.put("playerCount", count);
                dto.put("timeLimitSeconds", g.getTimeLimitSeconds());
                result.add(dto);
            }
        }
        return result;
    }

    // =========================
    // PLAYER: JOIN ROOM
    // =========================

    @Transactional
    @PostMapping("/{gameId}/join")
    public ResponseEntity<?> joinGame(@PathVariable Long gameId,
                                      @RequestParam Long userId) {

        Game game = requireGame(gameId);
        User user = requireUser(userId);

        if (game.getStatus() != Game.Status.ACTIVE) {
            return ResponseEntity.badRequest().body("Game is not open for joining");
        }

        long count = playerStatusRepository.countByGame_Id(gameId);
        if (count >= 4) {
            return ResponseEntity.badRequest().body("Room is full");
        }

        boolean alreadyJoined =
                playerStatusRepository.existsByGame_IdAndPlayer_Id(gameId, userId);

        if (!alreadyJoined) {
            PlayerGameStatus status = new PlayerGameStatus(user, game);
            playerStatusRepository.save(status);
            count++;
        }

        // start timer when FIRST player joins
        if (count == 1) {
            if (game.getCurrentQuestionId() == null) {
                game.setCurrentQuestionId(pickFirstQuestionId(game));
            }
            game.setCurrentTurnSlot(1);
            game.setCurrentTurn(1);
            game.setTurnEndsAt(computeTurnEndsAt(game));
            gameRepository.save(game);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("gameId", game.getId());
        response.put("roomName", game.getName());
        response.put("playerId", user.getId());
        response.put("players", count);
        response.put("timeLimitSeconds", game.getTimeLimitSeconds());
        response.put("currentTurnSlot", game.getCurrentTurnSlot());
        response.put("turnEndsAt", game.getTurnEndsAt());

        return ResponseEntity.ok(response);
    }

    // =========================
    // PLAYER: LEAVE ROOM
    // =========================

    @Transactional
    @PostMapping("/{gameId}/leave")
    public ResponseEntity<?> leaveGame(@PathVariable Long gameId,
                                       @RequestParam Long userId) {

        if (!gameRepository.existsById(gameId)) {
            return ResponseEntity.notFound().build();
        }
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.status(404).body("User not found");
        }

        List<PlayerGameStatus> statuses = playerStatusRepository.findByGame_Id(gameId);

        List<PlayerGameStatus> toDelete = statuses.stream()
                .filter(s -> s.getPlayer() != null && userId.equals(s.getPlayer().getId()))
                .toList();

        if (!toDelete.isEmpty()) {
            playerStatusRepository.deleteAll(toDelete);
        }

        long remaining = playerStatusRepository.countByGame_Id(gameId);

        Map<String, Object> response = new HashMap<>();
        response.put("gameId", gameId);
        response.put("remainingPlayers", remaining);
        response.put("message", "Player left the room");

        return ResponseEntity.ok(response);
    }

    // =========================
    // ROOM: LIST PLAYERS
    // =========================

    @GetMapping("/{gameId}/players")
    public ResponseEntity<?> getPlayersInRoom(@PathVariable Long gameId) {
        if (!gameRepository.existsById(gameId)) {
            return ResponseEntity.notFound().build();
        }

        List<PlayerGameStatus> statuses = playerStatusRepository.findByGame_Id(gameId);
        statuses.sort(Comparator.comparing(PlayerGameStatus::getId));

        List<Map<String, Object>> players = new ArrayList<>();
        int slot = 1;

        for (PlayerGameStatus s : statuses) {
            User u = s.getPlayer();
            if (u == null) continue;

            Map<String, Object> dto = new HashMap<>();
            dto.put("userId", u.getId());
            dto.put("username", u.getUsername());
            dto.put("slot", slot);
            players.add(dto);

            slot++;
            if (slot > 4) break;
        }

        return ResponseEntity.ok(players);
    }

    // =========================
    // ROOM: GET QUESTIONS
    // =========================

    @GetMapping("/{gameId}/questions")
    public ResponseEntity<?> getQuestionsForGame(@PathVariable Long gameId) {
        Optional<Game> optGame = gameRepository.findById(gameId);
        if (optGame.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Game game = optGame.get();
        Set<Question> questions = game.getQuestions();
        List<Map<String, Object>> result = new ArrayList<>();
        if (questions != null) {
            for (Question q : questions) {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", q.getId());
                dto.put("content", q.getContent());
                dto.put("correctAnswer", q.getCorrectAnswer());
                dto.put("level", q.getLevel());
                dto.put("hasImage", q.getImageData() != null && q.getImageData().length > 0);
                result.add(dto);
            }
        }

        return ResponseEntity.ok(result);
    }

    // =========================
    // ✅ GAME STATE (state-only)
    // =========================

    @GetMapping("/{gameId}/state")
    public ResponseEntity<?> getGameState(@PathVariable Long gameId) {
        if (!gameRepository.existsById(gameId)) {
            return ResponseEntity.notFound().build();
        }

        Game game = requireGame(gameId);

        ensureNotExpired(game);
        game = requireGame(gameId);

        List<PlayerGameStatus> statuses = getStatusesSorted(gameId);

        List<Map<String, Object>> players = new ArrayList<>();
        for (int i = 0; i < statuses.size(); i++) {
            PlayerGameStatus s = statuses.get(i);
            User u = s.getPlayer();
            if (u == null) continue;

            Map<String, Object> dto = new HashMap<>();
            dto.put("slot", i + 1);
            dto.put("userId", u.getId());
            dto.put("username", u.getUsername());
            dto.put("position", s.getPosition());
            players.add(dto);
        }

        Map<String, Object> qDto = null;
        if (game.getCurrentQuestionId() != null) {
            Optional<Question> qOpt = questionRepository.findById(game.getCurrentQuestionId());
            if (qOpt.isPresent()) {
                Question q = qOpt.get();
                qDto = new HashMap<>();
                qDto.put("id", q.getId());
                qDto.put("content", q.getContent());
                qDto.put("hasImage", q.getImageData() != null && q.getImageData().length > 0);
            }
        }

        Map<String, Object> state = new HashMap<>();
        state.put("gameId", game.getId());
        state.put("roomName", game.getName());
        state.put("status", game.getStatus().name());
        state.put("serverNow", nowMs());
        state.put("turnEndsAt", game.getTurnEndsAt());
        state.put("activeSlot", game.getCurrentTurnSlot());
        state.put("question", qDto);
        state.put("players", players);
        state.put("timeLimitSeconds", game.getTimeLimitSeconds());

        state.put("winnerUserId", game.getWinnerUserId());
        state.put("winnerUsername", game.getWinnerUsername());
        state.put("finishedAt", game.getFinishedAt());

        return ResponseEntity.ok(state);
    }

    // =========================
    // ✅ ANSWER + Prize Card
    // Returns: { correct, appliedCard?, state }
    // =========================
    @Transactional
    @PostMapping("/{gameId}/answer")
    public ResponseEntity<?> submitAnswer(@PathVariable Long gameId,
                                          @RequestBody AnswerRequest req) {

        if (req.getUserId() == null) {
            return ResponseEntity.badRequest().body("userId is required");
        }

        Game game = requireGame(gameId);

        if (game.getStatus() == Game.Status.FINISHED) {
            return ResponseEntity.badRequest().body("Game already finished");
        }

        if (game.getStatus() != Game.Status.ACTIVE) {
            return ResponseEntity.badRequest().body("Game is not ACTIVE");
        }

        // if expired, advance first
        ensureNotExpired(game);
        game = requireGame(gameId);

        Long userId = req.getUserId();

        if (!isUserInGame(gameId, userId)) {
            return ResponseEntity.status(403).body("User is not in this game");
        }

        int userSlot = slotOfUser(gameId, userId);
        if (userSlot <= 0) {
            return ResponseEntity.status(403).body("User slot not found");
        }

        // ✅ if current active player is blocked, skip automatically
        advanceTurnSkippingBlocked(game);
        gameRepository.save(game);
        game = requireGame(gameId);

        Integer activeSlot = game.getCurrentTurnSlot();
        if (activeSlot == null) activeSlot = 1;

        if (userSlot != activeSlot) {
            return ResponseEntity.status(409).body("Not your turn");
        }

        // ensure current question
        if (game.getCurrentQuestionId() == null) {
            game.setCurrentQuestionId(pickFirstQuestionId(game));
        }

        Question question = null;
        if (game.getCurrentQuestionId() != null) {
            question = questionRepository.findById(game.getCurrentQuestionId()).orElse(null);
        }

        boolean correct = false;
        if (question != null) {
            String given = (req.getAnswer() == null ? "" : req.getAnswer().trim());
            String expected = (question.getCorrectAnswer() == null ? "" : question.getCorrectAnswer().trim());
            correct = given.equalsIgnoreCase(expected);
        }

        PlayerGameStatus actor = requireStatus(gameId, userId);

        Map<String, Object> out = new HashMap<>();
        out.put("correct", correct);

        PrizeCard appliedCard = null;

        if (correct) {
            // ✅ base move +1 (EXACT landing, no overshoot)
            actor.moveByExact(1);
            playerStatusRepository.save(actor);

            // ✅ winner check immediately
            if (finishIfWinner(game, actor)) {
                out.put("appliedCard", null);
                out.put("state", getGameState(gameId).getBody());
                return ResponseEntity.ok(out);
            }

            // draw + apply prize immediately (still exact landing)
            PrizeCard drawn = drawRandomCard(new Random());
            appliedCard = applyCard(game, actor, drawn);
            out.put("appliedCard", appliedCard);

            // ✅ prize card might have finished the game
            if (game.getStatus() == Game.Status.FINISHED) {
                out.put("state", getGameState(gameId).getBody());
                return ResponseEntity.ok(out);
            }
        }

        if (game.getStatus() == Game.Status.FINISHED) {
            out.put("state", getGameState(gameId).getBody());
            return ResponseEntity.ok(out);
        }

        // ✅ Advance turn then skip blocked players
        advanceTurnToNextPlayer(game);
        advanceTurnSkippingBlocked(game);

        // next question + reset timer
        game.setCurrentQuestionId(pickNextQuestionId(game, game.getCurrentQuestionId()));
        game.setTurnEndsAt(computeTurnEndsAt(game));
        gameRepository.save(game);

        out.put("state", getGameState(gameId).getBody());
        return ResponseEntity.ok(out);
    }

    // =========================
    // ✅ TIMEOUT (advance turn)
    // =========================
    @Transactional
    @PostMapping("/{gameId}/timeout")
    public ResponseEntity<?> timeout(@PathVariable Long gameId,
                                     @RequestBody TimeoutRequest req) {

        Game game = requireGame(gameId);

        if (game.getStatus() == Game.Status.FINISHED) {
            return ResponseEntity.badRequest().body("Game already finished");
        }

        if (game.getStatus() != Game.Status.ACTIVE) {
            return ResponseEntity.badRequest().body("Game is not ACTIVE");
        }

        // optional safety: only active player can timeout
        if (req != null && req.getUserId() != null) {
            Long userId = req.getUserId();
            if (!isUserInGame(gameId, userId)) {
                return ResponseEntity.status(403).body("User is not in this game");
            }
            int userSlot = slotOfUser(gameId, userId);
            Integer activeSlot = game.getCurrentTurnSlot();
            if (activeSlot == null) activeSlot = 1;

            if (userSlot != activeSlot) {
                return ResponseEntity.status(409).body("Only active player can timeout");
            }
        }

        // advance + skip blocked players
        advanceTurnToNextPlayer(game);
        advanceTurnSkippingBlocked(game);

        game.setCurrentQuestionId(pickNextQuestionId(game, game.getCurrentQuestionId()));
        game.setTurnEndsAt(computeTurnEndsAt(game));
        gameRepository.save(game);

        return getGameState(gameId);
    }

    // =========================
    // ADMIN: FINISH ROOM
    // =========================

    @PostMapping("/{gameId}/finish")
    public ResponseEntity<?> finishGame(@PathVariable Long gameId) {
        return gameRepository.findById(gameId)
                .map(game -> {
                    game.setStatus(Game.Status.FINISHED);
                    game.setTurnEndsAt(null);
                    gameRepository.save(game);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // =========================
    // ✅ ADMIN: DELETE SINGLE ROOM SAFELY
    // =========================

    @Transactional
    @DeleteMapping("/{gameId}")
    public ResponseEntity<?> deleteGame(@PathVariable Long gameId) {

        if (!gameRepository.existsById(gameId)) {
            return ResponseEntity.notFound().build();
        }

        gameRepository.deleteGameQuestions(gameId);
        playerStatusRepository.deleteByGameId(gameId);
        gameRepository.deleteById(gameId);

        return ResponseEntity.ok("Room deleted: " + gameId);
    }

    // =========================
    // ✅ ADMIN: DELETE ALL ROOMS SAFELY
    // =========================

    @Transactional
    @DeleteMapping("/admin/deleteAll")
    public ResponseEntity<?> deleteAllRooms() {

        List<Game> games = gameRepository.findAll();

        for (Game g : games) {
            Long gameId = g.getId();
            gameRepository.deleteGameQuestions(gameId);
            playerStatusRepository.deleteByGameId(gameId);
        }

        gameRepository.deleteAll();

        return ResponseEntity.ok("All rooms deleted successfully");
    }
}
