package com.lingshan.analytics.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "visitor_behavior_records",
        indexes = {
                @Index(name = "idx_visitor_behavior_source", columnList = "source"),
                @Index(name = "idx_visitor_behavior_ticket", columnList = "ticketId"),
                @Index(name = "idx_visitor_behavior_visit_date", columnList = "visitDate"),
                @Index(name = "idx_visitor_behavior_created_at", columnList = "createdAt")
        })
public class VisitorBehaviorRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 48)
    private String source;

    @Column(length = 96)
    private String visitorId;

    @Column(length = 96)
    private String ticketId;

    @Column(length = 128)
    private String attractionName;

    @Column(length = 128)
    private String attractionType;

    @Column(length = 32)
    private String ageBand;

    @Column(length = 16)
    private String gender;

    private LocalDate visitDate;
    private Double stayHours;
    private Integer groupSize;
    private Double ticketCost;
    private Double foodCost;
    private Double shoppingCost;
    private Double transportCost;
    private Double entertainmentCost;
    private Double totalCost;
    private Double satisfaction;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getVisitorId() { return visitorId; }
    public void setVisitorId(String visitorId) { this.visitorId = visitorId; }

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }

    public String getAttractionName() { return attractionName; }
    public void setAttractionName(String attractionName) { this.attractionName = attractionName; }

    public String getAttractionType() { return attractionType; }
    public void setAttractionType(String attractionType) { this.attractionType = attractionType; }

    public String getAgeBand() { return ageBand; }
    public void setAgeBand(String ageBand) { this.ageBand = ageBand; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDate getVisitDate() { return visitDate; }
    public void setVisitDate(LocalDate visitDate) { this.visitDate = visitDate; }

    public Double getStayHours() { return stayHours; }
    public void setStayHours(Double stayHours) { this.stayHours = stayHours; }

    public Integer getGroupSize() { return groupSize; }
    public void setGroupSize(Integer groupSize) { this.groupSize = groupSize; }

    public Double getTicketCost() { return ticketCost; }
    public void setTicketCost(Double ticketCost) { this.ticketCost = ticketCost; }

    public Double getFoodCost() { return foodCost; }
    public void setFoodCost(Double foodCost) { this.foodCost = foodCost; }

    public Double getShoppingCost() { return shoppingCost; }
    public void setShoppingCost(Double shoppingCost) { this.shoppingCost = shoppingCost; }

    public Double getTransportCost() { return transportCost; }
    public void setTransportCost(Double transportCost) { this.transportCost = transportCost; }

    public Double getEntertainmentCost() { return entertainmentCost; }
    public void setEntertainmentCost(Double entertainmentCost) { this.entertainmentCost = entertainmentCost; }

    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }

    public Double getSatisfaction() { return satisfaction; }
    public void setSatisfaction(Double satisfaction) { this.satisfaction = satisfaction; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
