package com.Huseyin.boardGame.controller;

import com.Huseyin.boardGame.model.ChatMessage;
import com.Huseyin.boardGame.model.Game;
import com.Huseyin.boardGame.model.User;
import com.Huseyin.boardGame.repository.ChatMessageRepository;
import com.Huseyin.boardGame.repository.GameRepository;
import com.Huseyin.boardGame.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/games")
public class ChatController {

    private static final int CHAT_LIMIT = 50;
    private static final int MAX_LEN = 280;

    private final ChatMessageRepository chatRepo;
    private final GameRepository gameRepo;
    private final UserRepository userRepo;

    public ChatController(ChatMessageRepository chatRepo,
                          GameRepository gameRepo,
                          UserRepository userRepo) {
        this.chatRepo = chatRepo;
        this.gameRepo = gameRepo;
        this.userRepo = userRepo;
    }

    private Game requireGame(Long gameId) {
        return gameRepo.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found: " + gameId));
    }

    private User requireUser(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    private Map<String, Object> toDto(ChatMessage m) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", m.getId());
        dto.put("userId", m.getUser().getId());
        dto.put("username", m.getUser().getUsername());
        dto.put("text", m.getText());
        dto.put("createdAt", m.getCreatedAt());
        return dto;
    }

    public static class ChatSendRequest {
        public Long userId;
        public String text;
    }

    // GET /api/games/{gameId}/chat?afterId=123
    @Transactional(readOnly = true)
    @GetMapping("/{gameId}/chat")
    public ResponseEntity<?> getChat(@PathVariable Long gameId,
                                     @RequestParam(required = false) Long afterId) {

        if (!gameRepo.existsById(gameId)) {
            return ResponseEntity.notFound().build();
        }

        var page = PageRequest.of(0, CHAT_LIMIT);

        List<ChatMessage> msgs;
        if (afterId == null) {
            msgs = chatRepo.findLatestWithUser(gameId, page); // newest->oldest
            Collections.reverse(msgs); // oldest->newest for UI
        } else {
            msgs = chatRepo.findAfterWithUser(gameId, afterId, page); // already asc
        }

        List<Map<String, Object>> out = new ArrayList<>(msgs.size());
        for (ChatMessage m : msgs) out.add(toDto(m));

        return ResponseEntity.ok(out);
    }

    // POST /api/games/{gameId}/chat
    @Transactional
    @PostMapping("/{gameId}/chat")
    public ResponseEntity<?> sendChat(@PathVariable Long gameId,
                                      @RequestBody ChatSendRequest req) {

        if (req == null || req.userId == null) {
            return ResponseEntity.badRequest().body("userId is required");
        }
        if (req.text == null) {
            return ResponseEntity.badRequest().body("text is required");
        }

        String t = req.text.trim();
        if (t.isEmpty()) return ResponseEntity.badRequest().body("text is empty");
        if (t.length() > MAX_LEN) t = t.substring(0, MAX_LEN);

        Game game = requireGame(gameId);
        User user = requireUser(req.userId);

        ChatMessage saved = chatRepo.save(new ChatMessage(
                game, user, t, System.currentTimeMillis()
        ));

        return ResponseEntity.ok(toDto(saved));
    }
}
