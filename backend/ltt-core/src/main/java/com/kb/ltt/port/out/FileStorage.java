package com.kb.ltt.port.out;

import java.io.InputStream;

/**
 * Outbound port: File storage (S3-compatible MinIO or filesystem mount).
 */
public interface FileStorage {

    /**
     * Store file.
     *
     * @param path        storage path: /ltt/{orderId}/{attachmentId}.{ext}
     * @param inputStream file content
     * @param contentType MIME type
     * @return file hash (SHA-256)
     */
    String store(String path, InputStream inputStream, String contentType);

    /**
     * Load file as stream.
     */
    InputStream load(String path);

    /**
     * Delete file.
     */
    void delete(String path);
}
