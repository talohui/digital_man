package com.lingshan.analytics.repository;

import com.lingshan.analytics.entity.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<AnalyticsEvent, Long> {

    /** 查询某时刻之后的所有事件（今日总览用） */
    List<AnalyticsEvent> findByTsAfter(LocalDateTime ts);

    /** 查询指定事件类型在某时刻之后的记录 */
    List<AnalyticsEvent> findByEventAndTsAfter(String event, LocalDateTime ts);

    /** 查询某时刻之后的所有事件，按时间倒序（实时事件流用） */
    List<AnalyticsEvent> findByTsAfterOrderByTsDesc(LocalDateTime ts);
}
