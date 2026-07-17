package com.lingshan.analytics.controller;
import com.lingshan.analytics.dto.*;
import com.lingshan.analytics.service.DecisionActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.List;
@RestController
@RequestMapping("/api/dashboard/decision-actions")
public class DecisionActionController {
 private final DecisionActionService service;
 public DecisionActionController(DecisionActionService service){this.service=service;}
 @GetMapping("") public List<DecisionActionDto> list(@RequestParam String snapshotId){return service.list(snapshotId);}
 @PostMapping("") public DecisionActionDto create(@RequestBody CreateDecisionActionRequest request){return service.create(request.cardId(),request.actionText());}
 @PatchMapping("/{id}") public DecisionActionDto update(@PathVariable String id,@RequestBody UpdateDecisionActionRequest request){return service.update(id,request.status(),request.owner(),request.dueAt(),request.note());}
 @PostMapping("/{id}/evaluate") public DecisionActionDto evaluate(@PathVariable String id,@RequestBody EvaluateDecisionActionRequest request){return service.evaluate(id,request.baselineStart(),request.baselineEnd(),request.resultStart(),request.resultEnd());}
 @ExceptionHandler(IllegalArgumentException.class) public ResponseEntity<Map<String,Object>> badRequest(IllegalArgumentException e){return error(400,e.getMessage());}
 @ExceptionHandler(IllegalStateException.class) public ResponseEntity<Map<String,Object>> conflict(IllegalStateException e){return error(409,e.getMessage());}
 @ExceptionHandler(NoSuchElementException.class) public ResponseEntity<Map<String,Object>> notFound(NoSuchElementException e){return error(404,e.getMessage());}
 private ResponseEntity<Map<String,Object>> error(int status,String message){return ResponseEntity.status(status).body(Map.of("ok",false,"message",message));}
}
