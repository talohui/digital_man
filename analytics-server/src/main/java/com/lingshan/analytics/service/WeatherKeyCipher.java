package com.lingshan.analytics.service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

final class WeatherKeyCipher {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    private final SecretKeySpec key;

    WeatherKeyCipher(String masterKey) {
        if (masterKey == null || masterKey.isBlank()) {
            throw new IllegalArgumentException("安全配置加密主密钥未设置");
        }
        this.key = new SecretKeySpec(sha256(masterKey), "AES");
    }

    String encrypt(String value) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return "v1:" + ENCODER.encodeToString(iv) + ":" + ENCODER.encodeToString(ciphertext);
        } catch (Exception exception) {
            throw new IllegalStateException("安全配置加密失败", exception);
        }
    }

    String decrypt(String encrypted) {
        try {
            String[] parts = encrypted == null ? new String[0] : encrypted.split(":", -1);
            if (parts.length != 3 || !"v1".equals(parts[0])) {
                throw new IllegalArgumentException("密文格式无效");
            }
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, DECODER.decode(parts[1])));
            return new String(cipher.doFinal(DECODER.decode(parts[2])), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new IllegalStateException("安全配置解密失败", exception);
        }
    }

    private byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception exception) {
            throw new IllegalStateException("无法准备安全配置加密密钥", exception);
        }
    }
}
