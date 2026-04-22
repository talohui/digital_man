# gorse-docker

灵山地图导览这版只接“路线推荐”，不做完整推荐中台。这个目录按 Gorse 官方 Docker cluster 形态组织：

- `master` 提供 dashboard，暴露 `8088`
- `server` 提供 REST API，暴露 `8087`
- `worker` 负责离线训练
- `mysql` 同时作为 cache/data store

## 启动

1. 复制环境变量模板：

```bash
cp .env.example .env
```

2. 启动集群：

```bash
/usr/local/bin/docker-compose up -d
```

3. 访问服务：

- REST API: `http://127.0.0.1:8087`
- Dashboard: `http://127.0.0.1:8088`

## 本版固定配置

- `default_n = 3`
- `positive_feedback_types = ["select_route"]`
- `read_feedback_types = ["impression_route"]`
- 推荐对象只建模为路线 item

## 当前已验证状态

- `master` dashboard：`8088`
- `server` REST：`8087`
- `analytics-server` 已成功 seed：
  - `3` 条路线 item
  - `6` 个种子用户
  - `12` 条历史反馈
- `POST /api/guide/recommendations` 已确认能返回真 Gorse 结果
- `POST /api/guide/feedback` 已确认能写入 `select_route`

## 推荐验证命令

```bash
curl -s http://127.0.0.1:8087/api/health/live
```

正常应返回：

```json
{
  "Ready": true,
  "DataStoreConnected": true,
  "CacheStoreConnected": true
}
```

## 与 analytics-server 联动

`analytics-server` 默认读取下面三个环境变量：

```properties
GORSE_ENABLED=true
GORSE_BASE_URL=http://127.0.0.1:8087
GORSE_API_KEY=lingshan-gorse-local-key
```

启动后后端会自动：

- upsert 3 条路线 item
- upsert 一组种子用户
- 写入少量 `impression_route` / `select_route` 历史反馈

所以 dashboard 起起来后，应该能直接看到路线 item、用户和反馈，不会是全空冷启动。

## 默认登录信息

- Dashboard: `http://127.0.0.1:8088`
- Username: `admin`
- Password: `admin123`

## 已知坑位

### 1. 优先使用独立版 compose

建议直接使用：

```bash
/usr/local/bin/docker-compose up -d
```

### 2. `master` 不能带 `--cache-path`

这个参数会导致 `gorse-master` 容器反复重启，当前 compose 已经移除。

### 3. `master` 正常但 `server` 还没 ready

如果 `master` 已经 `Up`，但 `8087/api/health/live` 还是 `Ready: false`，执行：

```bash
/usr/local/bin/docker-compose restart server worker
```

### 4. 彻底重建

```bash
/usr/local/bin/docker-compose down -v
/usr/local/bin/docker-compose up -d
```
