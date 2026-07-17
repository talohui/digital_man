package com.lingshan.analytics.service;

import java.util.List;

public interface EmailReportSender {
    void send(List<String> recipients, RenderedEmail email);
}
