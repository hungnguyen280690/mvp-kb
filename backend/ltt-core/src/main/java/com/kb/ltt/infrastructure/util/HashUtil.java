package com.kb.ltt.infrastructure.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Utility for computing SHA-256 hashes.
 */
public final class HashUtil {

    private HashUtil() {
        // Utility class — no instances
    }

    /**
     * Compute SHA-256 hex string from raw bytes.
     */
    public static String sha256(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /**
     * Compute SHA-256 hex string from a UTF-8 string.
     */
    public static String sha256(String data) {
        return sha256(data.getBytes(StandardCharsets.UTF_8));
    }
}
