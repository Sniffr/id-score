package com.idverification.controllers;

import com.idverification.models.IdVerification;
import com.idverification.services.IdVerificationService;
import com.idverification.services.LivenessCheckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.format.DateTimeFormatter;

@Controller
@RequestMapping("/verification")
public class VerificationController {

    @Autowired
    private IdVerificationService idVerificationService;
    
    @Autowired
    private LivenessCheckService livenessCheckService;
    
    @GetMapping("/start")
    public String startVerification() {
        return "verification/start";
    }
    
    @GetMapping("/id-front")
    public String showIdFrontPage(Model model) {
        // For direct access, we'll use placeholder values
        model.addAttribute("idNumber", "SAMPLE123");
        model.addAttribute("fullName", "Test User");
        
        return "verification/id-front";
    }
    
    @PostMapping("/id-front")
    public String captureIdFront(@RequestParam("idNumber") String idNumber,
                                @RequestParam("fullName") String fullName,
                                Model model) {
        // Create a new verification record
        IdVerification verification = idVerificationService.createVerification(idNumber, fullName);
        
        // Add attributes to model for the next page
        model.addAttribute("idNumber", idNumber);
        model.addAttribute("fullName", fullName);
        
        return "verification/id-front";
    }
    
    @PostMapping("/id-back")
    public String captureIdBack(@RequestParam("idNumber") String idNumber,
                              @RequestParam("fullName") String fullName,
                              @RequestParam(value = "frontImageData", required = false) String frontImageData,
                              Model model) {
        // Update verification with front image if provided
        if (frontImageData != null && !frontImageData.isEmpty()) {
            IdVerification verification = idVerificationService.updateFrontImage(idNumber, frontImageData);
        }
        
        // Add attributes to model for the next page
        model.addAttribute("idNumber", idNumber);
        model.addAttribute("fullName", fullName);
        
        return "verification/id-back";
    }
    
    @PostMapping("/liveness")
    public String livenessCheck(@RequestParam("idNumber") String idNumber,
                              @RequestParam("fullName") String fullName,
                              @RequestParam(value = "frontImageData", required = false) String frontImageData,
                              @RequestParam(value = "backImageData", required = false) String backImageData,
                              Model model) {
        // Update verification with back image if provided
        if (backImageData != null && !backImageData.isEmpty()) {
            IdVerification verification = idVerificationService.updateBackImage(idNumber, backImageData);
        }
        
        // Add attributes to model for the next page
        model.addAttribute("idNumber", idNumber);
        model.addAttribute("fullName", fullName);
        
        return "verification/liveness";
    }
    
    @PostMapping("/complete")
    public String completeVerification(@RequestParam("idNumber") String idNumber,
                                     @RequestParam("fullName") String fullName,
                                     @RequestParam("frontImageData") String frontImageData,
                                     @RequestParam("backImageData") String backImageData,
                                     @RequestParam("livenessImageData") String livenessImageData,
                                     Model model) {
        // Perform liveness check
        boolean livenessCheckPassed = livenessCheckService.performLivenessCheck(livenessImageData);
        
        // Verify face match between ID and liveness image
        boolean faceMatchPassed = livenessCheckService.verifyFaceMatch(frontImageData, livenessImageData);
        
        // Update verification with liveness image and status
        IdVerification verification = idVerificationService.updateLivenessImage(idNumber, livenessImageData);
        
        if (livenessCheckPassed && faceMatchPassed && verification != null) {
            // Verification successful
            model.addAttribute("success", true);
            model.addAttribute("idNumber", idNumber);
            model.addAttribute("fullName", fullName);
            model.addAttribute("verificationStatus", "VERIFIED");
            model.addAttribute("verificationDate", 
                    verification.getVerificationDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            
            // In a real application, we would generate URLs to the stored images
            // For this demo, we'll pass the base64 data directly
            model.addAttribute("frontImageUrl", frontImageData);
            model.addAttribute("backImageUrl", backImageData);
        } else {
            // Verification failed
            model.addAttribute("success", false);
            model.addAttribute("errorMessage", "Liveness check or face matching failed. Please try again.");
        }
        
        return "verification/complete";
    }
}
