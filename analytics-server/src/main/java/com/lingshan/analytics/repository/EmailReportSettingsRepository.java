package com.lingshan.analytics.repository;

import com.lingshan.analytics.entity.EmailReportSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailReportSettingsRepository extends JpaRepository<EmailReportSettings, String> {
}
