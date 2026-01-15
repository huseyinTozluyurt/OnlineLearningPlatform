package com.Huseyin.boardGame.controller;

import com.Huseyin.boardGame.model.User;
import com.Huseyin.boardGame.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173") // adjust port if needed
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ====== LIST ALL USERS (no passwords) ======
    @GetMapping
    public List<UserDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ====== GET SINGLE USER (no password) ======
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        return userOpt
                .map(user -> ResponseEntity.ok(UserDto.fromEntity(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ====== DELETE USER ======
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // (Optional) You can add update / change-role endpoints later

    // ====== DTO ======
    public static class UserDto {
        private Long id;
        private String username;
        private String role;

        public static UserDto fromEntity(User user) {
            UserDto dto = new UserDto();
            dto.id = user.getId();
            dto.username = user.getUsername();
            dto.role = user.getRole().name();
            return dto;
        }

        public Long getId() { return id; }
        public String getUsername() { return username; }
        public String getRole() { return role; }
    }
}
