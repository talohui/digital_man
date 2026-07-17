package com.lingshan.analytics.repository;

import com.lingshan.analytics.entity.WeatherServiceSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WeatherServiceSettingsRepository extends JpaRepository<WeatherServiceSettings, String> {
}
