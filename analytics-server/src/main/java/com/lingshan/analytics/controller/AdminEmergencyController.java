package com.lingshan.analytics.controller;
import com.lingshan.analytics.dto.*;
import com.lingshan.analytics.service.EmergencyEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
@RestController @RequestMapping("/api/admin/emergencies")
public class AdminEmergencyController {
 private final EmergencyEventService service; public AdminEmergencyController(EmergencyEventService service){this.service=service;}
 @GetMapping public List<EmergencyEventDto> list(){return service.list();}
 @PostMapping("") public EmergencyEventDto create(@RequestBody EmergencyEventRequest request){return service.create(request);}
 @PutMapping("/{id}") public EmergencyEventDto update(@PathVariable String id,@RequestBody EmergencyEventRequest request){return service.update(id,request);}
 @PostMapping("/{id}/publish") public EmergencyEventDto publish(@PathVariable String id){return service.publish(id,LocalDateTime.now());}
 @PostMapping("/{id}/resolve") public EmergencyEventDto resolve(@PathVariable String id){return service.resolve(id,LocalDateTime.now());}
 @PostMapping("/{id}/retry-kb-sync") public EmergencyEventDto retryKnowledgeSync(@PathVariable String id){return service.retryKnowledgeSync(id);}
 @ExceptionHandler(IllegalArgumentException.class) public ResponseEntity<Map<String,Object>> bad(IllegalArgumentException e){return error(400,e.getMessage());}
 @ExceptionHandler(IllegalStateException.class) public ResponseEntity<Map<String,Object>> conflict(IllegalStateException e){return error(409,e.getMessage());}
 @ExceptionHandler(NoSuchElementException.class) public ResponseEntity<Map<String,Object>> missing(NoSuchElementException e){return error(404,e.getMessage());}
 private ResponseEntity<Map<String,Object>> error(int status,String message){return ResponseEntity.status(status).body(Map.of("ok",false,"message",message));}
}
