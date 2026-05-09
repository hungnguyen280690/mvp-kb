package vn.gov.kbnn.vdbas.bff.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Mock Security config — extract user info from headers.
 * In production, this would validate JWT tokens.
 * Roles: MAKER, CHECKER, APPROVER, ADMIN
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api/callback/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(new MockAuthFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /**
     * Mock auth filter — trust X-User-Id and X-User-Role headers.
     * In production, replace with JWT validation.
     */
    static class MockAuthFilter extends OncePerRequestFilter {

        private static final List<String> VALID_ROLES = List.of("MAKER", "CHECKER", "APPROVER", "ADMIN");

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {
            String userId = request.getHeader("X-User-Id");
            String userRole = request.getHeader("X-User-Role");

            // Callback endpoint does not require user headers
            if (request.getRequestURI().startsWith("/api/callback/")) {
                filterChain.doFilter(request, response);
                return;
            }

            if (userId != null && userRole != null && VALID_ROLES.contains(userRole)) {
                var auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        userId, null, List.of(() -> "ROLE_" + userRole));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } else if (userId == null) {
                response.sendError(401, "Missing X-User-Id header");
                return;
            }

            filterChain.doFilter(request, response);
        }
    }
}
