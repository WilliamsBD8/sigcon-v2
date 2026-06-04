package com.sigcon.backend.general.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.sigcon.backend.parametrization.companies.domain.service.CompanyService;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig {
   

    @Bean
    public CorsConfigurationSource corsConfigurationSource(CompanyService companyService) {

        return request -> {
            CorsConfiguration config = new CorsConfiguration();
    
            List<String> origins = new ArrayList<>();
    
            origins.add("http://localhost:5173");
            origins.add("http://localhost:3000");
            origins.add("http://157.230.220.199:5173");
    
            companyService.findAll().forEach(company -> {
                if (company.getIntegrationUrl() != null) {
                    origins.add(company.getIntegrationUrl());
                }
            });
    
    
            config.setAllowedOrigins(origins);
    
            config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    
    
            config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
    
    
            config.setAllowCredentials(true);
    
            return config;
        };

    }

}
