package com.Huseyin.boardGame.repository;

import com.Huseyin.boardGame.model.Question; // ✅ this was missing
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
}
