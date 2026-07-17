package com.lingshan.analytics.repository;

import com.lingshan.analytics.entity.EmailReportDispatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailReportDispatchRepository extends JpaRepository<EmailReportDispatch, String> {
    Optional<EmailReportDispatch> findByReportTypeAndPeriodKey(String reportType, String periodKey);

    List<EmailReportDispatch> findTop20ByOrderByCreatedAtDesc();
}
