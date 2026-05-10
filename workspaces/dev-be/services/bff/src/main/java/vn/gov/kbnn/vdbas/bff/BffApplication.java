package vn.gov.kbnn.vdbas.bff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.client.WebClient;

@SpringBootApplication
public class BffApplication {

    public static void main(String[] args) {
        SpringApplication.run(BffApplication.class, args);
    }

    @Bean
    public WebClient lttWebClient(WebClient.Builder builder,
                                   @org.springframework.beans.factory.annotation.Value("${ltt-service.url:http://localhost:8081}") String lttUrl) {
        return builder.baseUrl(lttUrl).build();
    }
}
