package com.lingshan.analytics.service;
import com.lingshan.analytics.entity.EmergencyEvent;
public interface EmergencyKnowledgeClient {
    String publish(EmergencyEvent event);
    void deactivate(String faqId);
    static EmergencyKnowledgeClient noop() {
        return new EmergencyKnowledgeClient() {
            public String publish(EmergencyEvent event) { return null; }
            public void deactivate(String faqId) { }
        };
    }
}
