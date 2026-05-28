package com.lingshan.analytics.controller;

import com.lingshan.analytics.service.AvatarConfigService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminConfigController {

    private final AvatarConfigService avatarConfigService;

    public AdminConfigController(AvatarConfigService avatarConfigService) {
        this.avatarConfigService = avatarConfigService;
    }

    @GetMapping("/avatar-config")
    public Map<String, Object> get() {
        return avatarConfigService.getAdminConfig();
    }

    @PutMapping("/avatar-config")
    public Map<String, Object> update(@RequestBody Map<String, Object> body) {
        return avatarConfigService.update(body);
    }
}
