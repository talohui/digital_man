package com.lingshan.analytics.service;
import java.util.Map;
public interface KnowledgeBaseTransport { Map<String,Object> postFaq(Map<String,Object> body); void updateFaq(String id,Map<String,Object> body); }
