package com.Huseyin.boardGame;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.Huseyin.boardGame.model")
@EnableJpaRepositories("com.Huseyin.boardGame.repository")
public class BoardGameApplication {
	public static void main(String[] args) {
		SpringApplication.run(BoardGameApplication.class, args);
	}
}
