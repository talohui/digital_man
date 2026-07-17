package com.lingshan.analytics.controller;
import com.lingshan.analytics.dto.EmergencyEventRequest;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.*;
import static org.assertj.core.api.Assertions.assertThat;
class EmergencyEventControllerTest {
 @Test void exposesAdminLifecycleAndPublicActiveRoutes() throws Exception {
  assertThat(AdminEmergencyController.class.getAnnotation(RequestMapping.class).value()).containsExactly("/api/admin/emergencies");
  assertThat(AdminEmergencyController.class.getDeclaredMethod("create",EmergencyEventRequest.class).getAnnotation(PostMapping.class).value()).containsExactly("");
  assertThat(AdminEmergencyController.class.getDeclaredMethod("publish",String.class).getAnnotation(PostMapping.class).value()).containsExactly("/{id}/publish");
  assertThat(AdminEmergencyController.class.getDeclaredMethod("resolve",String.class).getAnnotation(PostMapping.class).value()).containsExactly("/{id}/resolve");
  assertThat(AdminEmergencyController.class.getDeclaredMethod("retryKnowledgeSync",String.class).getAnnotation(PostMapping.class).value()).containsExactly("/{id}/retry-kb-sync");
  assertThat(PublicEmergencyController.class.getDeclaredMethod("active").getAnnotation(GetMapping.class).value()).containsExactly("/active");
 }
}
