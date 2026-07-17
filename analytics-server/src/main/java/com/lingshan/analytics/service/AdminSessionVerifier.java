package com.lingshan.analytics.service;

@FunctionalInterface
public interface AdminSessionVerifier {
    boolean verify(String fayAdminSessionToken);
}
