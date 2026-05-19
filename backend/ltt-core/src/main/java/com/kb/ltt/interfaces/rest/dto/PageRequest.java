package com.kb.ltt.interfaces.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Page request DTO matching openapi.yaml pagination parameters.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageRequest {

    @Builder.Default
    private Integer page = 0;

    @Builder.Default
    private Integer size = 20;

    private List<String> sort;
}
