package com.sigcon.backend.assistant.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.assistant")
public class AssistantProperties {

    private boolean enabled = true;
    private String apiKey = "";
    private String model = "gpt-4o-mini";
    private String baseUrl = "https://api.openai.com/v1";
    private int maxHistoryMessages = 12;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
