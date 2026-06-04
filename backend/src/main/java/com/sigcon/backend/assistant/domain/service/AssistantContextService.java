package com.sigcon.backend.assistant.domain.service;

import com.sigcon.backend.dashboard.application.DashboardKpiDTO;
import com.sigcon.backend.dashboard.application.DashboardOverviewDTO;
import com.sigcon.backend.dashboard.domain.service.DashboardService;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.parametrization.users.domain.model.Role;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.utils.UserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssistantContextService {

    private final UserUtil userUtil;
    private final DashboardService dashboardService;

    public String buildSystemPrompt() {
        User user = userUtil.getUser();
        DashboardOverviewDTO overview = dashboardService.getOverview();
        DashboardKpiDTO kpi = overview.getIndicators();

        String roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.joining(", "));

        Company company = user.getCompany();
        String companyBlock = "Empresa: no asignada";
        if (company != null) {
            String nit = company.getNit() != null ? company.getNit() : "";
            String dv = company.getDv() != null ? company.getDv() : "";
            String nitLabel = dv.isBlank() ? nit : nit + "-" + dv;
            companyBlock = String.format(
                    "Empresa: %s (NIT %s, id %d)",
                    company.getName(),
                    nitLabel,
                    company.getId()
            );
        }

        return """
                Eres el asistente virtual de SIGCON (gestión contable y financiera).
                Responde siempre en español, con tono profesional y conciso.
                Usa ÚNICAMENTE el contexto de sesión para cifras y datos de la empresa del usuario.
                Si no tienes un dato, dilo con claridad y orienta al módulo del sistema donde puede consultarlo.
                No inventes números ni información de otras empresas.

                === CONTEXTO DE SESIÓN ===
                Usuario: %s %s (%s)
                Roles: %s
                %s
                Alcance de datos: %s (%s)

                Indicadores actuales:
                - Facturas registradas: %d (monto total pagado: %s)
                - Comprobantes contables: %d (monto total: %s)
                - Activos fijos: %d
                - Cuentas bancarias: %d (saldo consolidado: %s)
                - Usuarios en alcance: %d
                %s
                """.formatted(
                user.getName(),
                user.getLastname(),
                user.getEmail(),
                roles.isBlank() ? "sin roles" : roles,
                companyBlock,
                overview.getScope(),
                overview.getCompanyName(),
                kpi.getTotalInvoices(),
                formatAmount(kpi.getTotalInvoiceAmount()),
                kpi.getTotalVouchers(),
                formatAmount(kpi.getTotalVoucherAmount()),
                kpi.getTotalAssets(),
                kpi.getTotalBankAccounts(),
                formatAmount(kpi.getTotalBankBalance()),
                kpi.getTotalUsers(),
                "GLOBAL".equals(overview.getScope())
                        ? "- Empresas activas en plataforma: " + kpi.getTotalCompanies()
                        : ""
        );
    }

    public String buildSessionSummary() {
        User user = userUtil.getUser();
        DashboardOverviewDTO overview = dashboardService.getOverview();
        return user.getName() + " " + user.getLastname() + " · " + overview.getCompanyName();
    }

    private String formatAmount(BigDecimal value) {
        if (value == null) {
            return "0";
        }
        return value.toPlainString();
    }
}
