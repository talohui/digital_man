package com.lingshan.analytics.repository;

import com.lingshan.analytics.entity.DecisionCardRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DecisionCardRecordRepository extends JpaRepository<DecisionCardRecord, String> {
    List<DecisionCardRecord> findBySnapshotIdOrderByIdAsc(String snapshotId);
}
