package com.lingshan.analytics.controller;

import com.lingshan.analytics.service.AvatarConfigService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicConfigController {

    private final AvatarConfigService avatarConfigService;

    public PublicConfigController(AvatarConfigService avatarConfigService) {
        this.avatarConfigService = avatarConfigService;
    }

    @GetMapping("/avatar-config")
    public Map<String, Object> avatarConfig() {
        return avatarConfigService.getPublicConfig();
    }
}
