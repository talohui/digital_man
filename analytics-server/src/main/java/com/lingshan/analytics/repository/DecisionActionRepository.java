package com.lingshan.analytics.repository;
import com.lingshan.analytics.entity.DecisionAction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DecisionActionRepository extends JpaRepository<DecisionAction,String>{
 List<DecisionAction> findBySnapshotIdOrderByCreatedAtDesc(String snapshotId);
}
