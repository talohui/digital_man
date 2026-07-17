# Time-Aware RAG and Emergency Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make temporary emergency FAQ knowledge valid only during its approved time window and synchronize it from analytics-server without rebuilding the document index.

**Architecture:** Extend the existing JSON FAQ schema compatibly in `scripts/rag_utils.py`. Retrieval filters inactive/not-yet-valid/expired FAQ and ranks active emergency entries first. analytics-server uses a small HTTP client; sync failure is persisted but never blocks alerts or route restrictions.

**Tech Stack:** Python 3, Flask, existing rag_utils/Chroma pipeline, unittest; Java 17 Spring RestClient.

---

### Task 1: Extend FAQ metadata compatibly

**Files:**
- Modify: `/Users/MR/Desktop/软件杯/lingshan-rag/scripts/rag_utils.py`
- Modify: `/Users/MR/Desktop/软件杯/lingshan-rag/kb_server/app.py`
- Create: `/Users/MR/Desktop/软件杯/lingshan-rag/kb_server/test_time_aware_faq.py`

- [ ] **Step 1: Write failing FAQ lifecycle tests**

```python
def test_old_faq_defaults_to_active_official(self):
    self.assertTrue(normalize_faq({"id": "1", "question": "q", "answer": "a"})["status"] == "active")

def test_inactive_future_and_expired_faq_are_not_candidates(self):
    visible = filter_active_faq(self.items, now="2026-07-13T12:00:00+08:00")
    self.assertEqual([item["id"] for item in visible], ["active-emergency", "legacy"])
```

- [ ] **Step 2: Run and confirm missing helper failure**

Run: `cd /Users/MR/Desktop/软件杯/lingshan-rag && python -m unittest kb_server.test_time_aware_faq -v`

Expected: FAIL because metadata helpers do not exist.

- [ ] **Step 3: Normalize and persist new fields**

Extend add/update with keyword arguments `source_type`, `valid_from`, `valid_until`, `status`, `emergency_id`. Legacy entries normalize to `sourceType=official`, `status=active`, null validity, and an `updatedAt` value derived from existing data or file mtime.

- [ ] **Step 4: Accept and return metadata in Flask FAQ APIs**

Pass camelCase request fields to rag_utils and preserve existing question/answer/tags behavior. Reject malformed ISO timestamps and `validUntil <= validFrom` with HTTP 400.

- [ ] **Step 5: Run and commit in the RAG repository**

Run: `cd /Users/MR/Desktop/软件杯/lingshan-rag && python -m unittest kb_server.test_time_aware_faq kb_server.test_upload_pipeline -v`

Expected: PASS without creating/rebuilding a Chroma index.

Commit: `git add scripts/rag_utils.py kb_server/app.py kb_server/test_time_aware_faq.py && git commit -m "feat: add validity metadata to faq knowledge"`

### Task 2: Filter and prioritize FAQ retrieval

**Files:**
- Modify: `/Users/MR/Desktop/软件杯/lingshan-rag/scripts/rag_utils.py`
- Create: `/Users/MR/Desktop/软件杯/lingshan-rag/scripts/test_time_aware_retrieval.py`

- [ ] **Step 1: Write failing ranking tests**

```python
def test_active_emergency_wins_over_matching_official_faq(self):
    result = find_best_faq("今天梵宫开放吗", now=self.now)
    self.assertEqual(result["id"], "emergency-1")

def test_resolved_emergency_is_not_returned(self):
    self.items[0]["status"] = "inactive"
    self.assertNotEqual(find_best_faq("今天梵宫开放吗", now=self.now)["id"], "emergency-1")
```

- [ ] **Step 2: Run and confirm wrong selection**

Run: `cd /Users/MR/Desktop/软件杯/lingshan-rag && python -m unittest scripts.test_time_aware_retrieval -v`

Expected: FAIL because current matcher ignores validity/source priority.

- [ ] **Step 3: Filter before scoring and add deterministic source boost**

Before text similarity, discard non-active/out-of-window entries. For otherwise comparable matches apply priority `emergency > official > admin > third_party`; do not alter Chroma document search or force document metadata migration.

- [ ] **Step 4: Run complete lightweight RAG tests and commit**

Run: `cd /Users/MR/Desktop/软件杯/lingshan-rag && python -m unittest kb_server.test_time_aware_faq scripts.test_time_aware_retrieval kb_server.test_ingestion -v`

Expected: PASS and no index files changed.

Commit: `git add scripts/rag_utils.py scripts/test_time_aware_retrieval.py && git commit -m "feat: prioritize active emergency faq"`

### Task 3: Synchronize emergency lifecycle from analytics-server

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/config/KnowledgeBaseProperties.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/KnowledgeBaseFaqClient.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/entity/EmergencyEvent.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/EmergencyEventService.java`
- Modify: `analytics-server/src/main/resources/application.properties`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/EmergencyKnowledgeSyncTest.java`

- [ ] **Step 1: Write failing client/service tests with a stub HTTP server**

```java
EmergencyEventDto published = service.publish(id);
assertThat(published.kbSyncStatus()).isEqualTo("SYNCED");
assertThat(published.kbFaqId()).isEqualTo("faq-123");
stubServer.failNextRequest();
assertThat(service.publish(otherId).kbSyncStatus()).isEqualTo("FAILED");
assertThat(service.active(now)).extracting(EmergencyEventDto::id).contains(otherId);
```

- [ ] **Step 2: Run and confirm failure**

Run: `cd analytics-server && mvn -Dtest=EmergencyKnowledgeSyncTest test`

Expected: FAIL because the client and sync fields are absent.

- [ ] **Step 3: Implement bounded HTTP calls and sync status**

Use `RestClient` with base URL property `lingshan.kb.base-url=http://127.0.0.1:5011`, 2-second connect/read timeouts, and POST/PUT payloads containing `sourceType=emergency`, validity, status, and emergencyId. Store `PENDING|SYNCED|FAILED`, FAQ ID, and a sanitized error message.

- [ ] **Step 4: Deactivate on resolve and add explicit retry**

Resolving sends PUT with `status=inactive`; failure leaves the event resolved and sync status failed. Add `POST /api/admin/emergencies/{id}/retry-kb-sync`.

- [ ] **Step 5: Run analytics tests and commit**

Run: `cd analytics-server && mvn -Dtest=EmergencyKnowledgeSyncTest,EmergencyEventServiceTest test`

Expected: PASS for publish success/failure, resolve failure, and retry.

Commit: `git add analytics-server/src/main/java/com/lingshan/analytics analytics-server/src/main/resources/application.properties analytics-server/src/test/java/com/lingshan/analytics/service && git commit -m "feat: sync emergency events to rag faq"`

