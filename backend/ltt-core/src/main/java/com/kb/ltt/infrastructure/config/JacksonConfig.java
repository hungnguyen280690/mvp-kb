package com.kb.ltt.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.setPropertyNamingStrategy(new PropertyNamingStrategies.NamingBase() {
            @Override
            public String translate(String javaName) {
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < javaName.length(); i++) {
                    char c = javaName.charAt(i);
                    if (Character.isUpperCase(c)) {
                        if (i > 0) sb.append('_');
                        sb.append(c);
                    } else {
                        sb.append(Character.toUpperCase(c));
                    }
                }
                return sb.toString();
            }
        });
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
