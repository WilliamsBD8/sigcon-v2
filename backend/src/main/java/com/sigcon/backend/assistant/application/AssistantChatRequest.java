package com.sigcon.backend.assistant.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantChatRequest {

    @NotBlank
    @Size(max = 4000)
    private String message;

    @Builder.Default
    private List<AssistantChatMessageDTO> history = new ArrayList<>();
}
