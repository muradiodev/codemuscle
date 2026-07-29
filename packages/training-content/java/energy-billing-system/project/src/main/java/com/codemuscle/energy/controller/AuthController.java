package com.codemuscle.energy.controller;

import com.codemuscle.energy.security.JwtAuthenticationService;
import com.codemuscle.energy.security.LoginRequest;
import com.codemuscle.energy.security.RegisterRequest;
import com.codemuscle.energy.security.TokenResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final JwtAuthenticationService authenticationService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse register(@Valid @RequestBody RegisterRequest request) {
        return authenticationService.register(request);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authenticationService.login(request);
    }

    @GetMapping("/me")
    public Map<String, Object> currentUser(@AuthenticationPrincipal Jwt token) {
        return Map.of(
                "username", token.getSubject(),
                "userId", token.getClaimAsString("userId"),
                "displayName", token.getClaimAsString("displayName"),
                "roles", token.getClaimAsStringList("roles")
        );
    }
}
