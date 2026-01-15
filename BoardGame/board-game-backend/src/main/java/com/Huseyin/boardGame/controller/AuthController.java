package com.Huseyin.boardGame.controller;

import com.Huseyin.boardGame.model.User;
import com.Huseyin.boardGame.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ====== LOGIN ======
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        User user = userOpt.get();

        // ✅ CORRECT BCrypt check
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        // Return basic info (no password)
        AuthResponse response = new AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getRole().name()
        );

        return ResponseEntity.ok(response);
    }

    // ====== REGISTER ======
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Username is already taken");
        }

        // ✅ encode password BEFORE saving
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(
                request.getUsername(),
                encodedPassword,
                request.getRole() != null ? request.getRole() : User.Role.PLAYER
        );

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("User registered successfully");
    }

    // ====== DTOs ======
    public static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private Long id;
        private String username;
        private String role;

        public AuthResponse(Long id, String username, String role) {
            this.id = id;
            this.username = username;
            this.role = role;
        }

        public Long getId() { return id; }
        public String getUsername() { return username; }
        public String getRole() { return role; }
    }

    public static class RegisterRequest {
        private String username;
        private String password;
        private User.Role role;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public User.Role getRole() { return role; }
        public void setRole(User.Role role) { this.role = role; }
    }
}
