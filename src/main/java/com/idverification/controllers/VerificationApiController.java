package com.idverification.controllers;

import com.amazonaws.services.rekognition.model.*;
import com.idverification.services.RekognitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/verify")
public class VerificationApiController {
    
    @Autowired
    private RekognitionService rekognitionService;
    
    @PostMapping("/validate-position")
    public ResponseEntity<Map<String, Object>> validateIdPosition(@RequestParam("frame") MultipartFile frame) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            byte[] imageBytes = frame.getBytes();
            DetectTextResult textResult = rekognitionService.detectText(imageBytes);
            DetectFacesResult facesResult = rekognitionService.detectFaces(imageBytes);
            
            // Check if we have enough text detected (ID card usually has text)
            boolean hasText = !textResult.getTextDetections().isEmpty();
            
            // Check if we detected any faces (ID card usually has a face)
            boolean hasFace = !facesResult.getFaceDetails().isEmpty();
            
            // Determine if the position is valid based on the checks
            boolean isValid = hasText && hasFace;
            
            // Provide guidance message based on the checks
            String message = isValid ? 
                "Perfect! Hold still for capture" : 
                "Position ID card within the guide";
            
            response.put("isValid", isValid);
            response.put("message", message);
            response.put("hasText", hasText);
            response.put("hasFace", hasFace);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("isValid", false);
            response.put("message", "Error validating ID position");
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/process-id")
    public ResponseEntity<Map<String, Object>> processIdDocument(
            @RequestParam("image") MultipartFile image,
            @RequestParam("idNumber") String idNumber) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            byte[] imageBytes = image.getBytes();
            
            // Analyze document with Rekognition
            DetectTextResult analyzeResult = rekognitionService.analyzeIdDocument(imageBytes);
            
            // We already have the text detection result from analyzeIdDocument
            DetectTextResult textResult = analyzeResult;
            
            // Process results and return response
            boolean isValidId = !textResult.getTextDetections().isEmpty();
            
            response.put("success", isValidId);
            response.put("idNumber", idNumber);
            response.put("nextUrl", "/verification/id-back?idNumber=" + idNumber);
            
            if (!isValidId) {
                response.put("message", "Could not validate ID document. Please try again.");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error processing ID document: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/liveness-check")
    public ResponseEntity<Map<String, Object>> livenessCheck(
            @RequestParam("image") MultipartFile image) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            byte[] imageBytes = image.getBytes();
            
            // Detect faces for liveness check
            DetectFacesResult facesResult = rekognitionService.detectFaces(imageBytes);
            
            if (facesResult.getFaceDetails().isEmpty()) {
                response.put("success", false);
                response.put("message", "No face detected. Please look directly at the camera.");
                return ResponseEntity.ok(response);
            }
            
            // Get the first face details
            FaceDetail face = facesResult.getFaceDetails().get(0);
            
            // Check for smile (for smile detection step)
            boolean isSmiling = face.getSmile().getValue();
            
            // Check for eye openness (for blink detection)
            boolean leftEyeOpen = face.getEyesOpen().getValue();
            boolean rightEyeOpen = face.getEyesOpen().getValue();
            
            // Check for head pose (for head turn detection)
            float yaw = face.getPose().getYaw();
            float pitch = face.getPose().getPitch();
            
            response.put("success", true);
            response.put("isSmiling", isSmiling);
            response.put("leftEyeOpen", leftEyeOpen);
            response.put("rightEyeOpen", rightEyeOpen);
            response.put("headYaw", yaw);
            response.put("headPitch", pitch);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error performing liveness check: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/face-match")
    public ResponseEntity<Map<String, Object>> faceMatch(
            @RequestParam("idImage") MultipartFile idImage,
            @RequestParam("selfieImage") MultipartFile selfieImage) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            byte[] idImageBytes = idImage.getBytes();
            byte[] selfieImageBytes = selfieImage.getBytes();
            
            // Compare faces between ID and selfie
            CompareFacesResult compareResult = rekognitionService.compareFaces(
                idImageBytes, selfieImageBytes);
            
            if (compareResult.getFaceMatches().isEmpty()) {
                response.put("success", false);
                response.put("message", "Face on ID does not match selfie. Please try again.");
                return ResponseEntity.ok(response);
            }
            
            // Get similarity score
            float similarity = compareResult.getFaceMatches().get(0).getSimilarity();
            
            response.put("success", true);
            response.put("similarity", similarity);
            response.put("match", similarity >= 90.0);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error comparing faces: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
