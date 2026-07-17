package com.lingshan.analytics.service;

/**
 * 消费转化决策的已脱敏聚合信号。
 * historicalBaseline 为 true 时，仅可作为推荐先验，不能表述为实时经营结果。
 */
public record ConsumptionSignal(
        boolean available,
        String topCategory,
        String sourceLabel,
        boolean historicalBaseline,
        double totalAmount,
        double categoryShare,
        double averageSpend,
        int ticketPurchaseCount,
        double ticketRevenue,
        double ancillaryAmount
) {
    public ConsumptionSignal {
        topCategory = topCategory == null ? "" : topCategory;
        sourceLabel = sourceLabel == null ? "" : sourceLabel;
    }

    public static ConsumptionSignal none() {
        return new ConsumptionSignal(false, "", "", false, 0, 0, 0, 0, 0, 0);
    }
}
