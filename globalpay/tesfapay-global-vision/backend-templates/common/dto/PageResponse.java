package com.globalpay.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Standard paginated response wrapper.
 * Maps to: API_CONTRACT.md §16 (Standard Pagination Response)
 *
 * Usage:
 *   Page<User> users = userRepository.findAll(pageable);
 *   return PageResponse.from(users);
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;

    public static <T> PageResponse<T> from(org.springframework.data.domain.Page<T> springPage) {
        return PageResponse.<T>builder()
                .content(springPage.getContent())
                .page(springPage.getNumber())
                .size(springPage.getSize())
                .totalPages(springPage.getTotalPages())
                .totalElements(springPage.getTotalElements())
                .build();
    }
}
