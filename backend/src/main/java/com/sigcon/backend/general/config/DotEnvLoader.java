package com.sigcon.backend.general.config;

import io.github.cdimascio.dotenv.Dotenv;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Carga variables desde backend/.env (o .env en el directorio de trabajo)
 * antes de iniciar Spring Boot. No sobrescribe variables ya definidas en el SO
 * (por ejemplo, las inyectadas por Docker Compose).
 */
public final class DotEnvLoader {

    private DotEnvLoader() {
    }

    public static Map<String, Object> loadAsSpringDefaults() {
        Path envFile = resolveEnvFile();
        if (envFile == null) {
            return Map.of();
        }

        String directory = envFile.getParent() != null
                ? envFile.getParent().toString()
                : ".";

        Dotenv dotenv = Dotenv.configure()
                .directory(directory)
                .filename(".env")
                .ignoreIfMalformed()
                .ignoreIfMissing()
                .load();

        Map<String, Object> defaults = new HashMap<>();
        dotenv.entries().forEach(entry -> {
            String key = entry.getKey();
            if (System.getenv(key) != null) {
                return;
            }
            if (System.getProperty(key) != null) {
                return;
            }
            defaults.put(key, entry.getValue());
        });

        return defaults;
    }

    private static Path resolveEnvFile() {
        Path[] candidates = {
                Path.of(".env"),
                Path.of("backend", ".env")
        };
        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate)) {
                return candidate.toAbsolutePath().normalize();
            }
        }
        return null;
    }
}
