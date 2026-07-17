package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.DecisionCard;
import com.lingshan.analytics.dto.DecisionComparison;
import com.lingshan.analytics.dto.DecisionHistoryPage;
import com.lingshan.analytics.dto.DecisionResponse;
import com.lingshan.analytics.dto.DecisionSnapshotDetail;
import com.lingshan.analytics.dto.DecisionSnapshotSummary;
import com.lingshan.analytics.entity.DecisionCardRecord;
import com.lingshan.analytics.entity.DecisionSnapshot;
import com.lingshan.analytics.repository.DecisionCardRecordRepository;
import com.lingshan.analytics.repository.DecisionSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class DecisionHistoryService {
    private final DecisionSnapshotRepository snapshotRepository;
    private final DecisionCardRecordRepository cardRepository;
    private final ObjectMapper objectMapper;

    public DecisionHistoryService(
            DecisionSnapshotRepository snapshotRepository,
            DecisionCardRecordRepository cardRepository,
            ObjectMapper objectMapper
    ) {
        this.snapshotRepository = snapshotRepository;
        this.cardRepository = cardRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public String save(
            DecisionResponse response,
            DecisionInput input,
            LocalDateTime inputWindowStart,
            LocalDateTime inputWindowEnd
    ) {
        String snapshotId = UUID.randomUUID().toString();
        DecisionSnapshot snapshot = new DecisionSnapshot();
        snapshot.setId(snapshotId);
        snapshot.setSummary(response.summary());
        snapshot.setGenerationSource(response.generationSource());
        snapshot.setGeneratedAt(parseGeneratedAt(response.generatedAt()));
        snapshot.setCacheHit(false);
        snapshot.setFallbackReason(response.fallbackReason());
        snapshot.setInputWindowStart(inputWindowStart);
        snapshot.setInputWindowEnd(inputWindowEnd);
        snapshot.setInputSummaryJson(writeJson(input));
        snapshot.setDataSourcesJson(writeJson(response.dataSources()));
        snapshot.setCreatedAt(LocalDateTime.now());
        snapshotRepository.save(snapshot);

        List<DecisionCardRecord> records = response.cards().stream()
                .map(card -> toRecord(snapshotId, card))
                .toList();
        cardRepository.saveAll(records);
        return snapshotId;
    }

    @Transactional(readOnly = true)
    public DecisionSnapshotDetail detail(String snapshotId) {
        DecisionSnapshot snapshot = snapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new NoSuchElementException("未找到决策快照"));
        List<DecisionCard> cards = cardRepository.findBySnapshotIdOrderByIdAsc(snapshotId).stream()
                .map(this::toDto)
                .toList();
        return new DecisionSnapshotDetail(
                snapshot.getId(), snapshot.getSummary(), snapshot.getGenerationSource(),
                snapshot.getGeneratedAt(), snapshot.getFallbackReason(),
                snapshot.getInputWindowStart(), snapshot.getInputWindowEnd(),
                readMap(snapshot.getInputSummaryJson()), readList(snapshot.getDataSourcesJson()), cards
        );
    }

    @Transactional(readOnly = true)
    public DecisionHistoryPage history(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Page<DecisionSnapshot> result = snapshotRepository.findAll(PageRequest.of(
                safePage, safeSize, Sort.by(Sort.Direction.DESC, "generatedAt")
        ));
        List<DecisionSnapshotSummary> items = result.getContent().stream()
                .map(snapshot -> new DecisionSnapshotSummary(
                        snapshot.getId(), snapshot.getSummary(), snapshot.getGenerationSource(),
                        snapshot.getGeneratedAt(), snapshot.getFallbackReason()
                ))
                .toList();
        return new DecisionHistoryPage(items, safePage, safeSize, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public DecisionComparison compare(String newerId, String olderId) {
        snapshotRepository.findById(newerId)
                .orElseThrow(() -> new NoSuchElementException("未找到较新决策快照"));
        snapshotRepository.findById(olderId)
                .orElseThrow(() -> new NoSuchElementException("未找到较旧决策快照"));
        Map<String, DecisionCardRecord> newer = byStableKey(
                cardRepository.findBySnapshotIdOrderByIdAsc(newerId));
        Map<String, DecisionCardRecord> older = byStableKey(
                cardRepository.findBySnapshotIdOrderByIdAsc(olderId));
        List<DecisionCard> added = newer.entrySet().stream()
                .filter(entry -> !older.containsKey(entry.getKey()))
                .map(Map.Entry::getValue).map(this::toDto).toList();
        List<DecisionCard> removed = older.entrySet().stream()
                .filter(entry -> !newer.containsKey(entry.getKey()))
                .map(Map.Entry::getValue).map(this::toDto).toList();
        List<DecisionComparison.PriorityChange> priorityChanged = newer.entrySet().stream()
                .filter(entry -> older.containsKey(entry.getKey()))
                .filter(entry -> !entry.getValue().getPriority().equals(older.get(entry.getKey()).getPriority()))
                .map(entry -> new DecisionComparison.PriorityChange(
                        entry.getKey(), entry.getValue().getTitle(),
                        older.get(entry.getKey()).getPriority(), entry.getValue().getPriority()
                ))
                .toList();
        return new DecisionComparison(added, removed, priorityChanged);
    }

    private Map<String, DecisionCardRecord> byStableKey(List<DecisionCardRecord> records) {
        Map<String, DecisionCardRecord> result = new LinkedHashMap<>();
        records.forEach(record -> result.put(record.getStableKey(), record));
        return result;
    }

    private DecisionCard toDto(DecisionCardRecord record) {
        List<String> evidence = readList(record.getEvidenceJson()).stream()
                .map(this::sanitizeEvidence)
                .toList();
        return new DecisionCard(
                record.getTitle(), record.getType(), record.getPriority(), evidence,
                record.getReason(), readList(record.getActionsJson()),
                readList(record.getRelatedTopicsJson()), readList(record.getRelatedSpotsJson()),
                record.isDemoFallback(), record.getId()
        );
    }

    private String sanitizeEvidence(String value) {
        String sanitized = value.replaceAll("(?i)(userId|sessionId)\\s*[:=]\\s*[^\\s，。；,;]+", "$1=***");
        return sanitized.length() <= 120 ? sanitized : sanitized.substring(0, 120);
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException error) {
            return List.of();
        }
    }

    private Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException error) {
            return Map.of();
        }
    }

    private DecisionCardRecord toRecord(String snapshotId, DecisionCard card) {
        DecisionCardRecord record = new DecisionCardRecord();
        record.setId(UUID.randomUUID().toString());
        record.setSnapshotId(snapshotId);
        record.setStableKey(stableKey(card));
        record.setTitle(card.title());
        record.setType(card.type());
        record.setPriority(card.priority());
        record.setEvidenceJson(writeJson(card.evidence()));
        record.setReason(card.reason());
        record.setActionsJson(writeJson(card.actions()));
        record.setRelatedTopicsJson(writeJson(card.relatedTopics()));
        record.setRelatedSpotsJson(writeJson(card.relatedSpots()));
        record.setDemoFallback(card.demoFallback());
        return record;
    }

    private String stableKey(DecisionCard card) {
        String spot = card.relatedSpots() == null || card.relatedSpots().isEmpty()
                ? "" : card.relatedSpots().get(0);
        return card.type() + ":" + card.title() + ":" + spot;
    }

    private LocalDateTime parseGeneratedAt(String generatedAt) {
        if (generatedAt == null || generatedAt.isBlank()) return LocalDateTime.now();
        try {
            return LocalDateTime.ofInstant(Instant.parse(generatedAt), ZoneId.systemDefault());
        } catch (DateTimeParseException ignored) {
            return LocalDateTime.now();
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("无法保存决策快照", error);
        }
    }
}
