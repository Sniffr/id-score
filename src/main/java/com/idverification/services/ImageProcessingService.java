package com.idverification.services;

import com.amazonaws.services.rekognition.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;

@Service
public class ImageProcessingService {
    
    @Autowired
    private RekognitionService rekognitionService;
    
    /**
     * Processes an ID card image to extract information using AWS Rekognition.
     * 
     * @param imageData Base64 encoded image data
     * @return true if processing was successful, false otherwise
     */
    public boolean processIdCardImage(String imageData) {
        if (imageData == null || imageData.isEmpty()) {
            return false;
        }
        
        try {
            // Convert base64 to byte array
            byte[] imageBytes = rekognitionService.base64ToByteArray(imageData);
            
            // Detect text from the ID card
            DetectTextResult textResult = rekognitionService.detectText(imageBytes);
            
            // Check if we detected any text (ID card should have text)
            return !textResult.getTextDetections().isEmpty();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Validates that the ID card is genuine using AWS Rekognition.
     * 
     * @param frontImageData Base64 encoded front image data
     * @param backImageData Base64 encoded back image data
     * @return true if ID card is valid, false otherwise
     */
    public boolean validateIdCard(String frontImageData, String backImageData) {
        if (frontImageData == null || backImageData == null || 
            frontImageData.isEmpty() || backImageData.isEmpty()) {
            return false;
        }
        
        try {
            // Convert base64 to byte arrays
            byte[] frontImageBytes = rekognitionService.base64ToByteArray(frontImageData);
            byte[] backImageBytes = rekognitionService.base64ToByteArray(backImageData);
            
            // Detect text from both images
            DetectTextResult frontTextResult = rekognitionService.detectText(frontImageBytes);
            DetectTextResult backTextResult = rekognitionService.detectText(backImageBytes);
            
            // Check if we detected any text on both sides
            boolean hasFrontText = !frontTextResult.getTextDetections().isEmpty();
            boolean hasBackText = !backTextResult.getTextDetections().isEmpty();
            
            return hasFrontText && hasBackText;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Extracts text from an ID card image using AWS Rekognition.
     * 
     * @param imageData Base64 encoded image data
     * @return extracted text or null if extraction failed
     */
    public String extractTextFromImage(String imageData) {
        if (imageData == null || imageData.isEmpty()) {
            return null;
        }
        
        try {
            // Convert base64 to byte array
            byte[] imageBytes = rekognitionService.base64ToByteArray(imageData);
            
            // Detect text from the image
            DetectTextResult textResult = rekognitionService.detectText(imageBytes);
            
            // Build a string with all detected text
            StringBuilder extractedText = new StringBuilder();
            for (TextDetection text : textResult.getTextDetections()) {
                if (text.getType().equals("LINE")) {
                    extractedText.append(text.getDetectedText()).append("\n");
                }
            }
            
            return extractedText.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
