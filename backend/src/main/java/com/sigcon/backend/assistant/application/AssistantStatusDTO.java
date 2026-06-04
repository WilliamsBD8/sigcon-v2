package com.sigcon.backend.assistant.application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantStatusDTO {

    private boolean enabled;
    private boolean configured;
    private String model;
}
