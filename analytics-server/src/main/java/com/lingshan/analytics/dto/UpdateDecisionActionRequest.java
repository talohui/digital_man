package com.lingshan.analytics.dto;
import java.time.LocalDateTime;
public record UpdateDecisionActionRequest(String status,String owner,LocalDateTime dueAt,String note){}
