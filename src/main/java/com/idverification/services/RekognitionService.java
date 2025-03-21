package com.idverification.services;

import com.amazonaws.services.rekognition.AmazonRekognition;
import com.amazonaws.services.rekognition.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.ByteBuffer;
import java.util.Base64;
import java.util.List;

@Service
public class RekognitionService {
    
    @Autowired
    private AmazonRekognition rekognitionClient;
    
    /**
     * Analyzes an ID document for text and fields
     * 
     * @param imageBytes ID document image as byte array
     * @return DetectTextResult with extracted information
     */
    public DetectTextResult analyzeIdDocument(byte[] imageBytes) {
        try {
            // For ID documents, we'll use text detection instead of document analysis
            // since AnalyzeDocument is part of Amazon Textract, not Rekognition
            return detectText(imageBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error analyzing ID document", e);
        }
    }
    
    /**
     * Detects text from an image
     * 
     * @param imageBytes Image as byte array
     * @return DetectTextResult with detected text
     */
    public DetectTextResult detectText(byte[] imageBytes) {
        try {
            Image image = new Image().withBytes(ByteBuffer.wrap(imageBytes));
            
            DetectTextRequest request = new DetectTextRequest()
                .withImage(image);
            
            return rekognitionClient.detectText(request);
        } catch (Exception e) {
            throw new RuntimeException("Error detecting text", e);
        }
    }
    
    /**
     * Detects faces in an image
     * 
     * @param imageBytes Image as byte array
     * @return DetectFacesResult with face details
     */
    public DetectFacesResult detectFaces(byte[] imageBytes) {
        try {
            Image image = new Image().withBytes(ByteBuffer.wrap(imageBytes));
            
            DetectFacesRequest request = new DetectFacesRequest()
                .withImage(image)
                .withAttributes(Attribute.ALL);
            
            return rekognitionClient.detectFaces(request);
        } catch (Exception e) {
            throw new RuntimeException("Error detecting faces", e);
        }
    }
    
    /**
     * Compares faces between two images
     * 
     * @param sourceImageBytes Source image as byte array
     * @param targetImageBytes Target image as byte array
     * @return CompareFacesResult with similarity score
     */
    public CompareFacesResult compareFaces(byte[] sourceImageBytes, byte[] targetImageBytes) {
        try {
            Image sourceImage = new Image().withBytes(ByteBuffer.wrap(sourceImageBytes));
            Image targetImage = new Image().withBytes(ByteBuffer.wrap(targetImageBytes));
            
            CompareFacesRequest request = new CompareFacesRequest()
                .withSourceImage(sourceImage)
                .withTargetImage(targetImage)
                .withSimilarityThreshold(90f);
            
            return rekognitionClient.compareFaces(request);
        } catch (Exception e) {
            throw new RuntimeException("Error comparing faces", e);
        }
    }
    
    /**
     * Helper method to convert base64 image to byte array
     * 
     * @param base64Image Base64 encoded image
     * @return byte array
     */
    public byte[] base64ToByteArray(String base64Image) {
        if (base64Image == null || base64Image.isEmpty()) {
            return null;
        }
        
        try {
            // Extract the base64 image data (remove data:image/png;base64, prefix)
            String[] parts = base64Image.split(",");
            String encodedImage = parts.length > 1 ? parts[1] : parts[0];
            return Base64.getDecoder().decode(encodedImage);
        } catch (Exception e) {
            throw new RuntimeException("Error converting base64 to byte array", e);
        }
    }
}
