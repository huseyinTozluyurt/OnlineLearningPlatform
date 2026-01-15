package com.Huseyin.boardGame.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "correct_answer", nullable = false, length = 255)
    private String correctAnswer;

    @Column(name = "level")
    private int level = 1;

    // ✅ Image stored in DB
    @Lob
    @JsonIgnore // IMPORTANT: do NOT include in normal JSON responses
    @Column(name = "image_data", columnDefinition = "LONGBLOB")
    private byte[] imageData;

    @Column(name = "image_content_type", length = 100)
    private String imageContentType;

    public Question() {}

    public Question(String content, String correctAnswer, int level) {
        this.content = content;
        this.correctAnswer = correctAnswer;
        this.level = level;
    }

    public Long getId() { return id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    // ✅ image getters/setters
    public byte[] getImageData() { return imageData; }
    public void setImageData(byte[] imageData) { this.imageData = imageData; }

    public String getImageContentType() { return imageContentType; }
    public void setImageContentType(String imageContentType) { this.imageContentType = imageContentType; }

    // ✅ helper (optional)
    @Transient
    public boolean hasImage() {
        return imageData != null && imageData.length > 0;
    }
}
