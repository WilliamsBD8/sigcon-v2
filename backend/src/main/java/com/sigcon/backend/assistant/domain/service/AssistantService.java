package com.sigcon.backend.assistant.domain.service;

import com.sigcon.backend.assistant.application.AssistantChatMessageDTO;
import com.sigcon.backend.assistant.application.AssistantChatRequest;
import com.sigcon.backend.assistant.application.AssistantChatResponseDTO;
import com.sigcon.backend.assistant.application.AssistantStatusDTO;
import com.sigcon.backend.assistant.config.AssistantProperties;
import com.sigcon.backend.assistant.domain.client.OpenAiChatClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssistantService {

    private final AssistantProperties properties;
    private final AssistantContextService contextService;
    private final OpenAiChatClient openAiChatClient;

    public AssistantStatusDTO getStatus() {
        return AssistantStatusDTO.builder()
                .enabled(properties.isEnabled())
                .configured(properties.isConfigured())
                .model(properties.getModel())
                .build();
    }

    public AssistantChatResponseDTO chat(AssistantChatRequest request) {
        if (!properties.isEnabled()) {
            throw new IllegalStateException("El asistente de IA está deshabilitado.");
        }
        if (!properties.isConfigured()) {
            throw new IllegalStateException(
                    "El asistente no está configurado. Defina la variable de entorno OPENAI_API_KEY en el servidor."
            );
        }

        String message = request.getMessage().trim();
        if (!StringUtils.hasText(message)) {
            throw new IllegalArgumentException("El mensaje no puede estar vacío.");
        }

        String systemPrompt = contextService.buildSystemPrompt();
        List<Map<String, String>> history = sanitizeHistory(request.getHistory());
        List<Map<String, String>> apiMessages = openAiChatClient.toApiMessages(systemPrompt, history, message);
        String reply = openAiChatClient.complete(apiMessages);

        return AssistantChatResponseDTO.builder()
                .reply(reply)
                .sessionSummary(contextService.buildSessionSummary())
                .build();
    }

    private List<Map<String, String>> sanitizeHistory(List<AssistantChatMessageDTO> history) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }

        int max = properties.getMaxHistoryMessages();
        int from = Math.max(0, history.size() - max);
        List<Map<String, String>> sanitized = new ArrayList<>();

        for (int i = from; i < history.size(); i++) {
            AssistantChatMessageDTO item = history.get(i);
            if (item == null || !StringUtils.hasText(item.getContent()) || !StringUtils.hasText(item.getRole())) {
                continue;
            }
            String role = item.getRole().trim().toLowerCase();
            if (!"user".equals(role) && !"assistant".equals(role)) {
                continue;
            }
            sanitized.add(Map.of(
                    "role", role,
                    "content", item.getContent().trim()
            ));
        }
        return sanitized;
    }
}
