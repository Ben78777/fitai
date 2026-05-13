package com.fitai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // Fail fast if the upstream API is unreachable
        factory.setConnectTimeout(5_000);
        // Open Food Facts can be slow; 10s read timeout is generous but bounded
        factory.setReadTimeout(10_000);
        return new RestTemplate(factory);
    }
}
