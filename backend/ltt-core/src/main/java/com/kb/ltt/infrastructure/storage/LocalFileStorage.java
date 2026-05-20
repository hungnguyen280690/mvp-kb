package com.kb.ltt.infrastructure.storage;

import com.kb.ltt.port.out.FileStorage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class LocalFileStorage implements FileStorage {

    private final Map<String, byte[]> store = new ConcurrentHashMap<>();

    @Override
    public String store(String path, InputStream inputStream, String contentType) {
        try {
            byte[] bytes = inputStream.readAllBytes();
            store.put(path, bytes);
            log.info("File stored: path={}, size={}", path, bytes.length);
            return Integer.toHexString(bytes.hashCode());
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file: " + path, e);
        }
    }

    @Override
    public InputStream load(String path) {
        byte[] bytes = store.get(path);
        if (bytes == null) throw new RuntimeException("File not found: " + path);
        return new ByteArrayInputStream(bytes);
    }

    @Override
    public void delete(String path) {
        store.remove(path);
        log.info("File deleted: path={}", path);
    }
}
