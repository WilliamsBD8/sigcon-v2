package com.sigcon.backend.assistant.domain.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sigcon.backend.assistant.config.AssistantProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class OpenAiChatClient {

    private final AssistantProperties properties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public OpenAiChatClient(
            AssistantProperties properties,
            ObjectMapper objectMapper,
            @Qualifier("assistantRestTemplate") RestTemplate restTemplate
    ) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    public String complete(List<Map<String, String>> messages) {
        String url = properties.getBaseUrl().replaceAll("/$", "") + "/chat/completions";

        Map<String, Object> body = new HashMap<>();
        body.put("model", properties.getModel());
        body.put("messages", messages);
        body.put("temperature", 0.4);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(properties.getApiKey());

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    url,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.asText().isBlank()) {
                throw new IllegalStateException("La API de IA no devolvió una respuesta válida.");
            }
            return content.asText().trim();
        } catch (RestClientException e) {
            throw new IllegalStateException("No se pudo contactar al proveedor de IA: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new IllegalStateException("Error al procesar la respuesta de IA: " + e.getMessage(), e);
        }
    }

    public List<Map<String, String>> toApiMessages(String systemPrompt, List<Map<String, String>> history, String userMessage) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (history != null) {
            messages.addAll(history);
        }
        messages.add(Map.of("role", "user", "content", userMessage));
        return messages;
    }
}
