package com.kb.ltt.application.dto;

import lombok.*;

import java.util.List;

/**
 * Generic paginated response wrapper.
 *
 * @param <T> the element type
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {

    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
}
