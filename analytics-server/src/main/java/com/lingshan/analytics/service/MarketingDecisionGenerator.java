package com.lingshan.analytics.service;

import com.lingshan.analytics.dto.DecisionResponse;

@FunctionalInterface
public interface MarketingDecisionGenerator {
    DecisionResponse generate(DecisionInput input);
}
