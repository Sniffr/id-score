package com.idverification.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IdVerification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String idNumber;
    
    private String fullName;
    
    private LocalDateTime verificationDate;
    
    private boolean frontCaptured;
    
    private boolean backCaptured;
    
    private boolean livenessVerified;
    
    private String verificationStatus;
    
    @Lob
    private byte[] frontImage;
    
    @Lob
    private byte[] backImage;
    
    @Lob
    private byte[] livenessImage;
}
