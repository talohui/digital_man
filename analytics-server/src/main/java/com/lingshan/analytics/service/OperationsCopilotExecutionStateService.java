package com.lingshan.analytics.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingshan.analytics.entity.OperationsCopilotRecord;
import com.lingshan.analytics.repository.OperationsCopilotRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class OperationsCopilotExecutionStateService {
    private final OperationsCopilotRecordRepository records;
    private final ObjectMapper objectMapper;

    public OperationsCopilotExecutionStateService(
            OperationsCopilotRecordRepository records,
            ObjectMapper objectMapper
    ) {
        this.records = records;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OperationsCopilotRecord claim(String id, String expectedRevision) {
        if (records.claimDraftForExecution(id, expectedRevision, LocalDateTime.now()) != 1) {
            OperationsCopilotRecord current = records.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("未找到 Copilot 草案"));
            if ("DRAFT".equals(current.getProposalStatus())
                    && !expectedRevision.equals(current.getProposalRevision())) {
                throw new IllegalStateException("草案已更新，请重新审核后确认");
            }
            throw new IllegalStateException("该草案正在执行或已处理，请勿重复提交");
        }
        return find(id);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OperationsCopilotRecord discard(String id) {
        if (records.discardDraft(id, LocalDateTime.now()) != 1) {
            records.findById(id).orElseThrow(() -> new NoSuchElementException("未找到 Copilot 草案"));
            throw new IllegalStateException("该草案正在执行或已处理，不能忽略");
        }
        return find(id);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OperationsCopilotRecord complete(String id, Map<String, Object> executionResult) {
        OperationsCopilotRecord record = executing(id);
        record.setExecutionResultJson(write(executionResult));
        record.setProposalStatus("CONFIRMED");
        record.setUpdatedAt(LocalDateTime.now());
        return records.save(record);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OperationsCopilotRecord fail(String id, Map<String, Object> executionResult) {
        OperationsCopilotRecord record = executing(id);
        record.setExecutionResultJson(write(executionResult));
        record.setProposalStatus("FAILED");
        record.setUpdatedAt(LocalDateTime.now());
        return records.save(record);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OperationsCopilotRecord reconcile(String id, Map<String, Object> executionResult) {
        OperationsCopilotRecord record = executing(id);
        record.setExecutionResultJson(write(executionResult));
        record.setProposalStatus("RECONCILING");
        record.setUpdatedAt(LocalDateTime.now());
        return records.save(record);
    }

    private OperationsCopilotRecord executing(String id) {
        OperationsCopilotRecord record = find(id);
        if (!"EXECUTING".equals(record.getProposalStatus())) {
            throw new IllegalStateException("Copilot 草案执行状态已变化");
        }
        return record;
    }

    private OperationsCopilotRecord find(String id) {
        return records.findById(id)
                .orElseThrow(() -> new NoSuchElementException("未找到 Copilot 草案"));
    }

    private String write(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("无法保存 Copilot 执行结果");
        }
    }
}
