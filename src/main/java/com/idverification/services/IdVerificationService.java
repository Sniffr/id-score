package com.idverification.services;

import com.idverification.models.IdVerification;
import com.idverification.repositories.IdVerificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class IdVerificationService {

    @Autowired
    private IdVerificationRepository idVerificationRepository;
    
    public IdVerification createVerification(String idNumber, String fullName) {
        IdVerification verification = new IdVerification();
        verification.setIdNumber(idNumber);
        verification.setFullName(fullName);
        verification.setVerificationDate(LocalDateTime.now());
        verification.setFrontCaptured(false);
        verification.setBackCaptured(false);
        verification.setLivenessVerified(false);
        verification.setVerificationStatus("PENDING");
        
        return idVerificationRepository.save(verification);
    }
    
    public IdVerification getVerificationById(Long id) {
        return idVerificationRepository.findById(id).orElse(null);
    }
    
    public IdVerification getVerificationByIdNumber(String idNumber) {
        return idVerificationRepository.findByIdNumber(idNumber);
    }
    
    public List<IdVerification> getAllVerifications() {
        return idVerificationRepository.findAll();
    }
    
    public IdVerification updateFrontImage(String idNumber, String frontImageData) {
        IdVerification verification = idVerificationRepository.findByIdNumber(idNumber);
        if (verification != null && frontImageData != null && !frontImageData.isEmpty()) {
            try {
                // Convert base64 image data to byte array
                String base64Image = frontImageData;
                // Check if the image data contains a data URL prefix
                if (frontImageData.contains(",")) {
                    base64Image = frontImageData.split(",")[1];
                }
                byte[] imageBytes = Base64.getDecoder().decode(base64Image);
                
                verification.setFrontImage(imageBytes);
                verification.setFrontCaptured(true);
                return idVerificationRepository.save(verification);
            } catch (Exception e) {
                // Log the error but don't fail the process
                System.err.println("Error processing front image: " + e.getMessage());
            }
        }
        return verification; // Return the verification object even if image processing failed
    }
    
    public IdVerification updateBackImage(String idNumber, String backImageData) {
        IdVerification verification = idVerificationRepository.findByIdNumber(idNumber);
        if (verification != null && backImageData != null && !backImageData.isEmpty()) {
            try {
                // Convert base64 image data to byte array
                String base64Image = backImageData;
                // Check if the image data contains a data URL prefix
                if (backImageData.contains(",")) {
                    base64Image = backImageData.split(",")[1];
                }
                byte[] imageBytes = Base64.getDecoder().decode(base64Image);
                
                verification.setBackImage(imageBytes);
                verification.setBackCaptured(true);
                return idVerificationRepository.save(verification);
            } catch (Exception e) {
                // Log the error but don't fail the process
                System.err.println("Error processing back image: " + e.getMessage());
            }
        }
        return verification; // Return the verification object even if image processing failed
    }
    
    public IdVerification updateLivenessImage(String idNumber, String livenessImageData) {
        IdVerification verification = idVerificationRepository.findByIdNumber(idNumber);
        if (verification != null && livenessImageData != null && !livenessImageData.isEmpty()) {
            try {
                // Convert base64 image data to byte array
                String base64Image = livenessImageData;
                // Check if the image data contains a data URL prefix
                if (livenessImageData.contains(",")) {
                    base64Image = livenessImageData.split(",")[1];
                }
                byte[] imageBytes = Base64.getDecoder().decode(base64Image);
                
                verification.setLivenessImage(imageBytes);
                verification.setLivenessVerified(true);
                verification.setVerificationStatus("VERIFIED");
                return idVerificationRepository.save(verification);
            } catch (Exception e) {
                // Log the error but don't fail the process
                System.err.println("Error processing liveness image: " + e.getMessage());
            }
        }
        return verification; // Return the verification object even if image processing failed
    }
    
    public boolean verifyLiveness(byte[] livenessImage) {
        // In a real application, this would use computer vision and ML models
        // to verify liveness (blink detection, head movement, etc.)
        // For this demo, we'll assume all liveness checks pass
        return true;
    }
    
    public boolean verifyIdCard(byte[] frontImage, byte[] backImage) {
        // In a real application, this would use OCR and image processing
        // to verify the ID card is genuine and extract information
        // For this demo, we'll assume all ID cards are valid
        return true;
    }
}
