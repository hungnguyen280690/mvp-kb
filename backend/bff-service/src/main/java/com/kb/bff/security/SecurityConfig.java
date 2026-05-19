package com.kb.bff.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for BFF service.
 * <ul>
 *   <li>CSRF disabled (stateless REST API)</li>
 *   <li>All /api/** endpoints require authentication</li>
 *   <li>/actuator/** endpoints are publicly accessible</li>
 *   <li>Session management: STATELESS</li>
 *   <li>JWT filter inserted before UsernamePasswordAuthenticationFilter</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write("""
                                    {"TRACE_ID":"%s","TIMESTAMP":"%s","CODE":"MSG-ERR-AUTH","MESSAGE":"Token expired or invalid"}"""
                                    .formatted(java.util.UUID.randomUUID(), java.time.OffsetDateTime.now()));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(403);
                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write("""
                                    {"TRACE_ID":"%s","TIMESTAMP":"%s","CODE":"MSG-ERR-PERMISSION","MESSAGE":"You do not have permission to perform this action"}"""
                                    .formatted(java.util.UUID.randomUUID(), java.time.OffsetDateTime.now()));
                        }))
                .build();
    }
}
