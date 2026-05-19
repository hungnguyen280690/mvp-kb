package com.kb.bff.config;

import io.netty.channel.ChannelOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

/**
 * WebClient configuration for proxying requests to ltt-service (internal API).
 * Target URL is configurable via ${ltt-service.url} property.
 */
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient lttWebClient(
            @Value("${ltt-service.url:http://localhost:8081}") String lttServiceUrl
    ) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5_000)
                .responseTimeout(Duration.ofSeconds(30))
                .compress(true);

        return WebClient.builder()
                .baseUrl(lttServiceUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
