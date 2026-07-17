# Weather Configuration Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow the B-end service configuration page to securely persist and immediately use the Tencent weather WebService Key.

**Architecture:** The analytics server owns encrypted weather settings in its existing H2 database. Its existing Fay-admin-session verifier protects new weather settings endpoints. `TencentWeatherService` prefers the encrypted key, then falls back to the deployment environment key; the update endpoint invalidates its cache.

**Tech Stack:** React + TypeScript + Ant Design, Spring Boot 3, Spring Data JPA/H2, Java AES-GCM.

---

### Task 1: Create encrypted weather settings domain

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/config/AnalyticsConfigEncryptionProperties.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/entity/WeatherServiceSettings.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/repository/WeatherServiceSettingsRepository.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/UpdateWeatherServiceSettingsRequest.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/WeatherServiceSettingsResponse.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/WeatherServiceSettingsService.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/WeatherServiceSettingsServiceTest.java`

- [ ] Write a failing test that saves a Key using a fixed master key, verifies the stored value does not equal the original Key, and verifies the active Key decrypts correctly.
- [ ] Run `mvn -Dtest=WeatherServiceSettingsServiceTest test` and confirm it fails because the service is absent.
- [ ] Add an AES-GCM `v1:iv:ciphertext` encrypted record, masked response, blank-value preservation and environment fallback.
- [ ] Run the test again and confirm it passes.

### Task 2: Add authenticated API and immediate cache invalidation

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/controller/AdminWeatherSettingsController.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/TencentWeatherService.java`
- Modify: `analytics-server/src/main/resources/application.properties`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/controller/AdminWeatherSettingsControllerTest.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/TencentWeatherServiceTest.java`

- [ ] Write failing controller tests for rejected Fay sessions and successful masked saves.
- [ ] Run `mvn -Dtest=AdminWeatherSettingsControllerTest,TencentWeatherServiceTest test` and confirm failure.
- [ ] Add GET/PUT `/api/admin/weather-settings`, `X-Fay-Admin-Session` verification, `ANALYTICS_CONFIG_MASTER_KEY` property binding, and a `clearCache()` method invoked after save.
- [ ] Update `TencentWeatherService` to prefer persisted settings while preserving environment compatibility.
- [ ] Re-run the targeted tests and confirm they pass.

### Task 3: Integrate the B-end configuration page

**Files:**
- Create: `demo/src/api/weatherSettings.ts`
- Modify: `demo/src/pages/AdminServiceConfigPage.tsx`
- Modify: `demo/src/pages/AdminServiceConfigPage.test.ts`

- [ ] Write a failing page test that expects Tencent weather settings to load in the verified configuration workspace and use a masked Key input.
- [ ] Run `node --test src/pages/AdminServiceConfigPage.test.ts` from `demo` and confirm it fails.
- [ ] Add a compact weather card that loads/saves via the existing Fay session token, never pre-fills the Key, and explains the encrypted storage and immediate application behavior.
- [ ] Re-run the page test and confirm it passes.

### Task 4: Verify build and live API contract

**Files:**
- Test: `analytics-server/src/test/java/com/lingshan/analytics/service/WeatherServiceSettingsServiceTest.java`
- Test: `analytics-server/src/test/java/com/lingshan/analytics/controller/AdminWeatherSettingsControllerTest.java`
- Test: `demo/src/pages/AdminServiceConfigPage.test.ts`

- [ ] Run the complete weather-related Maven test set and the page test.
- [ ] Run `npm run build` from `demo`.
- [ ] Start analytics with `ANALYTICS_CONFIG_MASTER_KEY` set, save the supplied Key through the page, then verify `/api/public/weather` reports `available: true` without returning the Key.
