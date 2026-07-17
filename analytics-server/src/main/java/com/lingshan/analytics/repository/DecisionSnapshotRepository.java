package com.lingshan.analytics.repository;

import com.lingshan.analytics.entity.DecisionSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DecisionSnapshotRepository extends JpaRepository<DecisionSnapshot, String> {
}
