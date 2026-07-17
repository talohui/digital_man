package com.lingshan.analytics.dto;
import java.time.LocalDateTime;
import java.util.Map;
public record DecisionActionDto(String id,String cardId,String snapshotId,String actionText,String status,String owner,LocalDateTime dueAt,String note,LocalDateTime acceptedAt,LocalDateTime completedAt,LocalDateTime baselineWindowStart,LocalDateTime baselineWindowEnd,LocalDateTime evaluationWindowStart,LocalDateTime evaluationWindowEnd,Map<String,Object> baselineMetrics,Map<String,Object> resultMetrics){}
