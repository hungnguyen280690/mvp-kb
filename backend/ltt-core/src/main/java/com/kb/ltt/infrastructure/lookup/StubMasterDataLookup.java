package com.kb.ltt.infrastructure.lookup;

import com.kb.ltt.port.out.MasterDataLookup;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class StubMasterDataLookup implements MasterDataLookup {

    @Override
    public List<Map<String, String>> lookup(String type, String query) {
        log.info("MasterDataLookup stub: type={}, query={}", type, query);
        return List.of();
    }
}
