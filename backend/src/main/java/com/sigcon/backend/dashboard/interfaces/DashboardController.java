package com.sigcon.backend.dashboard.interfaces;

import com.sigcon.backend.dashboard.domain.service.DashboardService;
import com.sigcon.backend.utils.SuccessRespondJson;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getOverview() {
        return ResponseEntity.ok(
                SuccessRespondJson.getSuccessRespondMessage(
                        Optional.of("Indicadores del dashboard consultados correctamente"),
                        Optional.of(dashboardService.getOverview())
                )
        );
    }
}
