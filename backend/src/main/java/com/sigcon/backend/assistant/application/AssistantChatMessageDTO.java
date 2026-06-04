package com.sigcon.backend.assistant.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantChatMessageDTO {

    @NotBlank
    @Pattern(regexp = "user|assistant", message = "El rol debe ser user o assistant")
    private String role;

    @NotBlank
    private String content;
}
