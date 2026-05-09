package vn.gov.kbnn.vdbas.bff.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.gov.kbnn.vdbas.bff.client.LttServiceClient;
import vn.gov.kbnn.vdbas.bff.dto.RefDataItem;

import java.util.List;

/**
 * REST controller cho du lieu danh muc.
 * Mapping tu OpenAPI: GET /dm/channels, GET /dm/coa-segments
 */
@Slf4j
@RestController
@RequestMapping("/api/internal/v1/dm")
@RequiredArgsConstructor
public class ReferenceDataController {

    private final LttServiceClient lttClient;

    @GetMapping("/channels")
    public ResponseEntity<List<RefDataItem>> getChannels(
            @RequestHeader("X-User-Id") String userId) {
        log.info("Get channels reference data");
        return ResponseEntity.ok(lttClient.getChannels(userId));
    }

    @GetMapping("/coa-segments")
    public ResponseEntity<Object> getCoaSegments(
            @RequestParam(required = false) String segmentType,
            @RequestParam(required = false) String keyword,
            @RequestHeader("X-User-Id") String userId) {
        log.info("Get COA segments: segmentType={}, keyword={}", segmentType, keyword);
        return ResponseEntity.ok(lttClient.getCoaSegments(segmentType, keyword, userId));
    }
}
