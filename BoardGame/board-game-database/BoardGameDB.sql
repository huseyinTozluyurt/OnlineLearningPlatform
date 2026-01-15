-- Recreated BoardGameDB schema

DROP TABLE IF EXISTS player_prizes;
DROP TABLE IF EXISTS player_game_status;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS prizes;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  password VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  role ENUM('PLAYER','ADMIN') COLLATE utf8mb4_unicode_ci DEFAULT 'PLAYER',
  PRIMARY KEY (id),
  UNIQUE KEY username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  content TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  correct_answer VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  level INT DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prizes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  description TEXT COLLATE utf8mb4_unicode_ci,
  type ENUM('move','block','double_question','teleport','shield') COLLATE utf8mb4_unicode_ci NOT NULL,
  value INT DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE games (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  current_turn INT DEFAULT NULL,
  status ENUM('ACTIVE','FINISHED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE player_game_status (
  id BIGINT NOT NULL AUTO_INCREMENT,
  player_id BIGINT DEFAULT NULL,
  game_id BIGINT DEFAULT NULL,
  is_blocked TINYINT(1) DEFAULT 0,
  has_shield TINYINT(1) DEFAULT 0,
  question_multiplier INT DEFAULT 1,
  PRIMARY KEY (id),
  KEY player_id (player_id),
  KEY game_id (game_id),
  CONSTRAINT player_game_status_ibfk_1 FOREIGN KEY (player_id) REFERENCES users (id),
  CONSTRAINT player_game_status_ibfk_2 FOREIGN KEY (game_id) REFERENCES games (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE player_prizes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  player_id BIGINT DEFAULT NULL,
  game_id BIGINT DEFAULT NULL,
  prize_id BIGINT DEFAULT NULL,
  is_used TINYINT(1) DEFAULT 0,
  earned_turn INT DEFAULT NULL,
  PRIMARY KEY (id),
  KEY player_id (player_id),
  KEY game_id (game_id),
  KEY prize_id (prize_id),
  CONSTRAINT player_prizes_ibfk_1 FOREIGN KEY (player_id) REFERENCES users (id),
  CONSTRAINT player_prizes_ibfk_2 FOREIGN KEY (game_id) REFERENCES games (id),
  CONSTRAINT player_prizes_ibfk_3 FOREIGN KEY (prize_id) REFERENCES prizes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
