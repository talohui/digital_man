package com.lingshan.analytics.repository;

import com.lingshan.analytics.entity.VisitorBehaviorRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VisitorBehaviorRecordRepository extends JpaRepository<VisitorBehaviorRecord, Long> {

    long countBySource(String source);

    List<VisitorBehaviorRecord> findBySource(String source);

    List<VisitorBehaviorRecord> findBySourceAndCreatedAtAfter(String source, LocalDateTime createdAt);

    Optional<VisitorBehaviorRecord> findFirstBySourceAndTicketIdOrderByUpdatedAtDesc(String source, String ticketId);

    List<VisitorBehaviorRecord> findByVisitorId(String visitorId);

    long countByVisitorId(String visitorId);

    long deleteByVisitorId(String visitorId);
}
