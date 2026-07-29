package com.codemuscle.saas.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JwtAuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    public TokenResponse register(RegisterRequest request) {
        PlatformUser user = new PlatformUser(
                UUID.randomUUID().toString(),
                request.username(),
                passwordEncoder.encode(request.password()),
                request.email(),
                request.displayName(),
                request.jobTitle(),
                request.locale() == null ? "en" : request.locale(),
                Set.of("ROLE_USER"),
                true,
                Instant.now()
        );
        return issue(userRepository.save(user));
    }

    public TokenResponse login(LoginRequest request) {
        PlatformUser user = userRepository.findByUsername(request.username())
                .filter(PlatformUser::enabled)
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.passwordHash()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        return issue(user);
    }

    private TokenResponse issue(PlatformUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(60, ChronoUnit.MINUTES);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("codemuscle")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.username())
                .claim("roles", user.roles())
                .claim("displayName", user.displayName())
                .claim("userId", user.id())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new TokenResponse(token, "Bearer", expiresAt, user.username(), user.displayName(), user.roles());
    }
}
