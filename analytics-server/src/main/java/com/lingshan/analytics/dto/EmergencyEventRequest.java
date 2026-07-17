package com.lingshan.analytics.dto;
import java.time.LocalDateTime;
import java.util.List;
public record EmergencyEventRequest(String type,String title,String message,String severity,List<String> affectedSpotIds,List<String> affectedRouteIds,LocalDateTime validFrom,LocalDateTime validUntil,String routePolicy,String knowledgeQuestion,String knowledgeAnswer){}
