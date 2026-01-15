package com.Huseyin.boardGame.controller;

import com.Huseyin.boardGame.model.Question;
import com.Huseyin.boardGame.repository.QuestionRepository;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionRepository questionRepository;

    public QuestionController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    // === GET ALL QUESTIONS ===
    @GetMapping
    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    // === GET ONE QUESTION BY ID ===
    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable Long id) {
        Optional<Question> questionOpt = questionRepository.findById(id);
        return questionOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // === CREATE NEW QUESTION ===
    @PostMapping
    public ResponseEntity<Question> createQuestion(@RequestBody Question question) {
        Question saved = questionRepository.save(question);
        return ResponseEntity.ok(saved);
    }

    // === UPDATE EXISTING QUESTION ===
    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id,
                                                   @RequestBody Question updated) {
        return questionRepository.findById(id)
                .map(existing -> {
                    existing.setContent(updated.getContent());
                    existing.setCorrectAnswer(updated.getCorrectAnswer());
                    existing.setLevel(updated.getLevel());
                    Question saved = questionRepository.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // === DELETE QUESTION ===
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        if (!questionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        questionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================================
    // ✅ UPLOAD IMAGE (stored in DB)
    // POST /api/questions/{id}/image  form-data: file=<image>
    // ==========================================================
    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadQuestionImage(@PathVariable Long id,
                                                 @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .body("Only image files are allowed");
        }

        return questionRepository.findById(id)
                .map(q -> {
                    try {
                        q.setImageData(file.getBytes());
                        q.setImageContentType(contentType);
                        questionRepository.save(q);
                        return ResponseEntity.ok("Image uploaded successfully");
                    } catch (Exception e) {
                        return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
                    }
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ==========================================================
    // ✅ GET IMAGE
    // GET /api/questions/{id}/image
    // ==========================================================

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getQuestionImage(@PathVariable Long id) {

        Optional<Question> opt = questionRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Question q = opt.get();

        byte[] data = q.getImageData();
        if (data == null || data.length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String type = (q.getImageContentType() != null && !q.getImageContentType().isBlank())
                ? q.getImageContentType()
                : MediaType.IMAGE_JPEG_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(type))
                .body(data);
    }


    // ==========================================================
    // ✅ DELETE IMAGE (optional)
    // DELETE /api/questions/{id}/image
    // ==========================================================
    @DeleteMapping("/{id}/image")
    public ResponseEntity<?> deleteQuestionImage(@PathVariable Long id) {
        return questionRepository.findById(id)
                .map(q -> {
                    q.setImageData(null);
                    q.setImageContentType(null);
                    questionRepository.save(q);
                    return ResponseEntity.ok("Image removed");
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
