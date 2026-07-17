package com.lingshan.analytics.service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.dto.*;
import com.lingshan.analytics.entity.EmergencyEvent;
import com.lingshan.analytics.repository.EmergencyEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
@Service
public class EmergencyEventService {
 private static final Set<String>TYPES=Set.of("SCENIC_CLOSURE","SHOW_CANCELLED","EXTREME_WEATHER","CROWDING","ROAD_CLOSURE","MISSING_PERSON","MEDICAL_HELP");
 private static final Set<String>SEVERITIES=Set.of("INFO","WARNING","CRITICAL"),POLICIES=Set.of("NONE","PENALIZE","EXCLUDE");
 private final EmergencyEventRepository repository; private final EmergencyKnowledgeClient knowledgeClient; private final ObjectMapper json=new ObjectMapper().findAndRegisterModules();
 @Autowired public EmergencyEventService(EmergencyEventRepository repository,EmergencyKnowledgeClient knowledgeClient){this.repository=repository;this.knowledgeClient=knowledgeClient;}
 public EmergencyEventService(EmergencyEventRepository repository){this(repository,EmergencyKnowledgeClient.noop());}
 @Transactional public EmergencyEventDto create(EmergencyEventRequest r){validate(r);LocalDateTime now=LocalDateTime.now();EmergencyEvent e=new EmergencyEvent();e.setId(UUID.randomUUID().toString());apply(e,r);e.setStatus("DRAFT");e.setKbSyncStatus("PENDING");e.setCreatedAt(now);e.setUpdatedAt(now);return dto(repository.save(e));}
 @Transactional public EmergencyEventDto update(String id,EmergencyEventRequest r){validate(r);EmergencyEvent e=find(id);if("RESOLVED".equals(e.getStatus()))throw new IllegalStateException("已解除事件不能编辑");apply(e,r);e.setUpdatedAt(LocalDateTime.now());return dto(repository.save(e));}
 @Transactional public EmergencyEventDto publish(String id,LocalDateTime now){EmergencyEvent e=find(id);if("RESOLVED".equals(e.getStatus()))throw new IllegalStateException("已解除事件不能发布");if(!e.getValidUntil().isAfter(now))throw new IllegalStateException("已过期事件不能发布");e.setStatus("ACTIVE");e.setUpdatedAt(now);try{String faqId=knowledgeClient.publish(e);e.setKbFaqId(faqId);e.setKbSyncStatus(faqId==null?"PENDING":"SYNCED");e.setKbSyncError(null);}catch(RuntimeException error){e.setKbSyncStatus("FAILED");e.setKbSyncError(safeError(error));}return dto(repository.save(e));}
 @Transactional public EmergencyEventDto resolve(String id,LocalDateTime now){EmergencyEvent e=find(id);e.setStatus("RESOLVED");e.setResolvedAt(now);e.setUpdatedAt(now);if(e.getKbFaqId()!=null){try{knowledgeClient.deactivate(e.getKbFaqId());e.setKbSyncStatus("SYNCED");e.setKbSyncError(null);}catch(RuntimeException error){e.setKbSyncStatus("FAILED");e.setKbSyncError(safeError(error));}}return dto(repository.save(e));}
 @Transactional public EmergencyEventDto retryKnowledgeSync(String id){EmergencyEvent e=find(id);try{if("RESOLVED".equals(e.getStatus())&&e.getKbFaqId()!=null){knowledgeClient.deactivate(e.getKbFaqId());}else{e.setKbFaqId(knowledgeClient.publish(e));}e.setKbSyncStatus("SYNCED");e.setKbSyncError(null);}catch(RuntimeException error){e.setKbSyncStatus("FAILED");e.setKbSyncError(safeError(error));}e.setUpdatedAt(LocalDateTime.now());return dto(repository.save(e));}
 @Transactional(readOnly=true) public List<EmergencyEventDto> active(LocalDateTime now){return repository.findByStatus("ACTIVE").stream().filter(e->!now.isBefore(e.getValidFrom())&&now.isBefore(e.getValidUntil())).sorted(Comparator.comparingInt(e->severityRank(e.getSeverity()))).map(this::dto).toList();}
 @Transactional(readOnly=true) public List<EmergencyEventDto> list(){return repository.findAll().stream().sorted(Comparator.comparing(EmergencyEvent::getUpdatedAt).reversed()).map(this::dto).toList();}
 private void validate(EmergencyEventRequest r){if(r==null||!TYPES.contains(r.type()))throw new IllegalArgumentException("应急事件类型无效");if(!SEVERITIES.contains(r.severity()))throw new IllegalArgumentException("严重等级无效");if(!POLICIES.contains(r.routePolicy()))throw new IllegalArgumentException("路线策略无效");if(blank(r.title())||blank(r.message()))throw new IllegalArgumentException("标题和提醒内容不能为空");if(r.validFrom()==null||r.validUntil()==null||!r.validUntil().isAfter(r.validFrom()))throw new IllegalArgumentException("事件有效期无效");if(Set.of("MISSING_PERSON","MEDICAL_HELP").contains(r.type())&&(blank(r.knowledgeQuestion())||blank(r.knowledgeAnswer())))throw new IllegalArgumentException("走失或医疗事件必须填写管理员确认的处置说明");}
 private void apply(EmergencyEvent e,EmergencyEventRequest r){e.setType(r.type());e.setTitle(r.title().trim());e.setMessage(r.message().trim());e.setSeverity(r.severity());e.setAffectedSpotIdsJson(write(r.affectedSpotIds()==null?List.of():r.affectedSpotIds()));e.setAffectedRouteIdsJson(write(r.affectedRouteIds()==null?List.of():r.affectedRouteIds()));e.setValidFrom(r.validFrom());e.setValidUntil(r.validUntil());e.setRoutePolicy(r.routePolicy());e.setKnowledgeQuestion(trim(r.knowledgeQuestion()));e.setKnowledgeAnswer(trim(r.knowledgeAnswer()));}
 private EmergencyEvent find(String id){return repository.findById(id).orElseThrow(()->new NoSuchElementException("未找到应急事件"));} private int severityRank(String s){return "CRITICAL".equals(s)?0:"WARNING".equals(s)?1:2;}
 private String safeError(RuntimeException error){String value=error.getClass().getSimpleName();return value.length()>120?value.substring(0,120):value;}
 private EmergencyEventDto dto(EmergencyEvent e){return new EmergencyEventDto(e.getId(),e.getType(),e.getTitle(),e.getMessage(),e.getSeverity(),e.getStatus(),read(e.getAffectedSpotIdsJson()),read(e.getAffectedRouteIdsJson()),e.getValidFrom(),e.getValidUntil(),e.getRoutePolicy(),e.getKnowledgeQuestion(),e.getKnowledgeAnswer(),e.getKbFaqId(),e.getKbSyncStatus(),e.getCreatedAt(),e.getUpdatedAt(),e.getResolvedAt());}
 private String write(Object v){try{return json.writeValueAsString(v);}catch(JsonProcessingException ex){throw new IllegalStateException("无法保存应急事件",ex);}} private List<String> read(String v){if(blank(v))return List.of();try{return json.readValue(v,new TypeReference<>(){});}catch(JsonProcessingException ex){return List.of();}} private boolean blank(String v){return v==null||v.isBlank();} private String trim(String v){return blank(v)?null:v.trim();}
}
