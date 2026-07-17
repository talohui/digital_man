package com.lingshan.analytics.service;
import com.lingshan.analytics.entity.EmergencyEvent;
import org.springframework.stereotype.Service;
import java.time.ZoneId;
import java.util.*;
@Service public class HttpEmergencyKnowledgeClient implements EmergencyKnowledgeClient {
 private final KnowledgeBaseTransport transport; public HttpEmergencyKnowledgeClient(KnowledgeBaseTransport transport){this.transport=transport;}
 public String publish(EmergencyEvent e){Map<String,Object>b=new LinkedHashMap<>();b.put("question",value(e.getKnowledgeQuestion(),e.getTitle()));b.put("answer",value(e.getKnowledgeAnswer(),e.getMessage()));b.put("tags",List.of("应急事件",e.getType()));b.put("sourceType","emergency");b.put("validFrom",iso(e.getValidFrom()));b.put("validUntil",iso(e.getValidUntil()));b.put("status","active");b.put("emergencyId",e.getId());Map<String,Object>r=transport.postFaq(b);Object faq=r==null?null:r.get("faq");if(!(faq instanceof Map<?,?>m)||!(m.get("id") instanceof String id)||id.isBlank())throw new IllegalStateException("知识库未返回 FAQ ID");return id;}
 public void deactivate(String id){transport.updateFaq(id,Map.of("status","inactive"));} private String iso(java.time.LocalDateTime v){return v.atZone(ZoneId.systemDefault()).toOffsetDateTime().toString();} private String value(String v,String fallback){return v==null||v.isBlank()?fallback:v;}
}
