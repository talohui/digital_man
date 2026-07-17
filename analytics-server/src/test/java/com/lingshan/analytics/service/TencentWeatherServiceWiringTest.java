package com.lingshan.analytics.service;

import com.lingshan.analytics.AnalyticsApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
        classes = AnalyticsApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "spring.task.scheduling.enabled=false",
                "spring.datasource.url=jdbc:h2:mem:weather-wiring;DB_CLOSE_DELAY=-1",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.jpa.hibernate.ddl-auto=create-drop"
        }
)
class TencentWeatherServiceWiringTest {

    @Autowired
    private ApplicationContext context;

    @Test
    void createsWeatherServiceWithTheApplicationPropertiesConstructor() {
        assertThat(context.getBean(TencentWeatherService.class)).isNotNull();
    }
}
