package com.lingshan.analytics.service;
import com.lingshan.analytics.entity.EmergencyEvent;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
class HttpEmergencyKnowledgeClientTest {
 @Test void sendsEmergencyMetadataAndDeactivation(){FakeTransport transport=new FakeTransport();HttpEmergencyKnowledgeClient client=new HttpEmergencyKnowledgeClient(transport);EmergencyEvent event=new EmergencyEvent();event.setId("event-1");event.setType("SCENIC_CLOSURE");event.setKnowledgeQuestion("梵宫开放吗");event.setKnowledgeAnswer("临时关闭");event.setValidFrom(LocalDateTime.of(2026,7,13,12,0));event.setValidUntil(LocalDateTime.of(2026,7,13,14,0));String id=client.publish(event);client.deactivate(id);assertThat(id).isEqualTo("faq-1");assertThat(transport.posted).containsEntry("sourceType","emergency").containsEntry("emergencyId","event-1");assertThat(transport.putBody).containsEntry("status","inactive");}
 private static class FakeTransport implements KnowledgeBaseTransport {Map<String,Object>posted,putBody;public Map<String,Object> postFaq(Map<String,Object> body){posted=body;return Map.of("faq",Map.of("id","faq-1"));}public void updateFaq(String id,Map<String,Object>body){putBody=body;}}
}
