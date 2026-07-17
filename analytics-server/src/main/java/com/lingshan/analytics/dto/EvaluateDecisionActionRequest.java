package com.lingshan.analytics.dto;
import java.time.LocalDateTime;
public record EvaluateDecisionActionRequest(LocalDateTime baselineStart,LocalDateTime baselineEnd,LocalDateTime resultStart,LocalDateTime resultEnd){}
