package com.idverification.services;

import com.amazonaws.services.rekognition.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LivenessCheckService {
    
    @Autowired
    private RekognitionService rekognitionService;
    
    /**
     * Performs a liveness check on the provided image using AWS Rekognition.
     * 
     * @param livenessImageData Base64 encoded image data
     * @return true if liveness check passes, false otherwise
     */
    public boolean performLivenessCheck(String livenessImageData) {
        if (livenessImageData == null || livenessImageData.isEmpty()) {
            return false;
        }
        
        try {
            // Convert base64 to byte array
            byte[] imageBytes = rekognitionService.base64ToByteArray(livenessImageData);
            
            // Detect faces for liveness check
            DetectFacesResult facesResult = rekognitionService.detectFaces(imageBytes);
            
            if (facesResult.getFaceDetails().isEmpty()) {
                return false;
            }
            
            // Get the first face details
            FaceDetail face = facesResult.getFaceDetails().get(0);
            
            // Check for real face attributes (not a photo)
            // In a real application, you would check for eye blinks, head movements, etc.
            return face.getConfidence() > 90;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Checks if the face in the liveness image matches the face on the ID card
     * using AWS Rekognition.
     * 
     * @param idImageData Base64 encoded ID image data
     * @param livenessImageData Base64 encoded liveness image data
     * @return true if faces match, false otherwise
     */
    public boolean verifyFaceMatch(String idImageData, String livenessImageData) {
        if (idImageData == null || livenessImageData == null || 
            idImageData.isEmpty() || livenessImageData.isEmpty()) {
            return false;
        }
        
        try {
            // Convert base64 to byte arrays
            byte[] idImageBytes = rekognitionService.base64ToByteArray(idImageData);
            byte[] livenessImageBytes = rekognitionService.base64ToByteArray(livenessImageData);
            
            // Compare faces between ID and liveness image
            CompareFacesResult compareResult = rekognitionService.compareFaces(
                idImageBytes, livenessImageBytes);
            
            if (compareResult.getFaceMatches().isEmpty()) {
                return false;
            }
            
            // Check if similarity is above threshold (90%)
            return compareResult.getFaceMatches().get(0).getSimilarity() >= 90;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
