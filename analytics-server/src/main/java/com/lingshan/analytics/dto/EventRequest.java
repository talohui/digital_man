package com.lingshan.analytics.dto;

import java.util.Map;

/**
 * 前端 POST /api/events 的请求体
 */
public record EventRequest(
        String event,
        Map<String, Object> properties,
        String timestamp
) {}
