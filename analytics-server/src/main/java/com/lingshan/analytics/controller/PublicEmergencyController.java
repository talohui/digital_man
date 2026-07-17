package com.lingshan.analytics.controller;
import com.lingshan.analytics.dto.PublicEmergencyEventDto;
import com.lingshan.analytics.service.EmergencyEventService;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
@RestController @RequestMapping("/api/public/emergencies")
public class PublicEmergencyController {
 private final EmergencyEventService service; public PublicEmergencyController(EmergencyEventService service){this.service=service;}
 @GetMapping("/active") public List<PublicEmergencyEventDto> active(){return service.active(LocalDateTime.now()).stream().map(e->new PublicEmergencyEventDto(e.id(),e.type(),e.title(),e.message(),e.severity(),e.affectedSpotIds(),e.affectedRouteIds(),e.validFrom(),e.validUntil(),e.routePolicy(),e.updatedAt())).toList();}
}
