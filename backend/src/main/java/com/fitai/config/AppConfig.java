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
        // Gemini can take a few seconds; 20s keeps us safe without hanging forever
        factory.setReadTimeout(20_000);
        return new RestTemplate(factory);
    }
}
