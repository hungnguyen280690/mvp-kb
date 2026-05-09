package vn.gov.kbnn.vdbas.ltt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LttServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(LttServiceApplication.class, args);
    }
}
