package com.lingshan.analytics.repository;
import com.lingshan.analytics.entity.EmergencyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface EmergencyEventRepository extends JpaRepository<EmergencyEvent,String>{List<EmergencyEvent> findByStatus(String status);}
