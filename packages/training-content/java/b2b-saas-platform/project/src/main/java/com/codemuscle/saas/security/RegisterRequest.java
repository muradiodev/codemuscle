package com.codemuscle.saas.security;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 60) String username,
        @NotBlank @Size(min = 10, max = 100) String password,
        @NotBlank @Email String email,
        @NotBlank String displayName,
        String jobTitle,
        String locale
) {}
