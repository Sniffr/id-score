package com.idverification.config;

import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.rekognition.AmazonRekognition;
import com.amazonaws.services.rekognition.AmazonRekognitionClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AwsConfig {
    
    @Value("${aws.region:us-east-1}")
    private String awsRegion;
    
    @Bean
    public AmazonRekognition rekognitionClient() {
        return AmazonRekognitionClientBuilder.standard()
            .withRegion(Regions.fromName(awsRegion))
            .withCredentials(new DefaultAWSCredentialsProviderChain())
            .build();
    }
}
