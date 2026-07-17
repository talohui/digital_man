package com.lingshan.analytics.repository;

import com.lingshan.analytics.entity.OperationsCopilotRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface OperationsCopilotRecordRepository extends JpaRepository<OperationsCopilotRecord, String> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update OperationsCopilotRecord record
               set record.proposalStatus = 'EXECUTING', record.updatedAt = :updatedAt
             where record.id = :id
               and record.proposalStatus = 'DRAFT'
               and record.proposalRevision = :expectedRevision
            """)
    int claimDraftForExecution(
            @Param("id") String id,
            @Param("expectedRevision") String expectedRevision,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update OperationsCopilotRecord record
               set record.proposalStatus = 'DISCARDED', record.updatedAt = :updatedAt
             where record.id = :id and record.proposalStatus = 'DRAFT'
            """)
    int discardDraft(@Param("id") String id, @Param("updatedAt") LocalDateTime updatedAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update OperationsCopilotRecord record
               set record.proposalTitle = :title,
                   record.proposalSummary = :summary,
                   record.proposalPayloadJson = :payloadJson,
                   record.proposalRevision = :revision,
                   record.updatedAt = :updatedAt
             where record.id = :id and record.proposalStatus = 'DRAFT'
            """)
    int updateDraftProposal(
            @Param("id") String id,
            @Param("title") String title,
            @Param("summary") String summary,
            @Param("payloadJson") String payloadJson,
            @Param("revision") String revision,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}
