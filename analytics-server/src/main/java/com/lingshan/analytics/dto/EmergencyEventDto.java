package com.lingshan.analytics.dto;
import java.time.LocalDateTime;
import java.util.List;
public record EmergencyEventDto(String id,String type,String title,String message,String severity,String status,List<String> affectedSpotIds,List<String> affectedRouteIds,LocalDateTime validFrom,LocalDateTime validUntil,String routePolicy,String knowledgeQuestion,String knowledgeAnswer,String kbFaqId,String kbSyncStatus,LocalDateTime createdAt,LocalDateTime updatedAt,LocalDateTime resolvedAt){}
