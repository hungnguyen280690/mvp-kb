package com.kb.ltt.infrastructure.period;

import com.kb.ltt.port.out.PeriodControlGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
public class StubPeriodControlGateway implements PeriodControlGateway {

    @Override
    public boolean isOpen(String kbnnId, LocalDate date) {
        log.info("PeriodControl stub: kbnnId={}, date={} -> always true", kbnnId, date);
        return true;
    }
}
