package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Map;

@Service
public class OfficialBehaviorService {

    private static final String RESOURCE_PATH = "official-behavior/official-behavior-v1.json";

    private final ObjectMapper mapper;
    private Map<String, Object> data;

    public OfficialBehaviorService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> sourceMeta() {
        return section("sourceMeta");
    }

    public Map<String, Object> summary() {
        return section("summary");
    }

    public Map<String, Object> demographics() {
        return section("demographics");
    }

    public Map<String, Object> attractionTypes() {
        return section("attractionTypes");
    }

    public Map<String, Object> satisfaction() {
        return section("satisfaction");
    }

    public Map<String, Object> spending() {
        return section("spending");
    }

    public Map<String, Object> trends() {
        return section("trends");
    }

    public Map<String, Object> recommendationPriors() {
        return section("recommendationPriors");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> section(String key) {
        Object value = loadData().get(key);
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private Map<String, Object> loadData() {
        if (data == null) {
            data = readResource();
        }
        return data;
    }

    private Map<String, Object> readResource() {
        ClassPathResource resource = new ClassPathResource(RESOURCE_PATH);
        try (InputStream input = resource.getInputStream()) {
            return mapper.readValue(input, new TypeReference<>() {});
        } catch (IOException error) {
            throw new UncheckedIOException("Failed to read official behavior aggregate: " + RESOURCE_PATH, error);
        }
    }
}
