/**
 * Liveness Check functionality for Kenyan ID Verification System
 * Provides enhanced liveness detection and verification
 */

// Liveness Check utilities object
const LivenessCheck = {
    // Liveness check instructions
    instructions: [
        "Look straight at the camera",
        "Blink your eyes slowly",
        "Turn your head slightly to the right",
        "Turn your head slightly to the left",
        "Smile naturally"
    ],
    
    // Current instruction index
    currentInstructionIndex: 0,
    
    // Completed instructions
    completedInstructions: [],
    
    // Initialize liveness check
    initialize: function() {
        // Set first instruction
        this.updateInstructionText();
        
        // Setup next instruction button
        const nextInstructionBtn = document.getElementById('next-instruction-btn');
        if (nextInstructionBtn) {
            nextInstructionBtn.addEventListener('click', () => {
                this.nextInstruction();
            });
        }
        
        // Setup liveness capture button
        const livenessCaptureBtn = document.getElementById('liveness-capture-btn');
        if (livenessCaptureBtn) {
            livenessCaptureBtn.addEventListener('click', () => {
                // Mark current instruction as completed
                this.completeCurrentInstruction();
                
                // If all instructions completed, enable capture
                if (this.completedInstructions.length >= this.instructions.length) {
                    // Enable final capture
                    this.enableFinalCapture();
                }
            });
        }
    },
    
    // Update instruction text
    updateInstructionText: function() {
        const instructionText = document.getElementById('instruction-text');
        if (instructionText) {
            instructionText.textContent = this.instructions[this.currentInstructionIndex];
        }
    },
    
    // Move to next instruction
    nextInstruction: function() {
        // Mark current instruction as completed
        this.completeCurrentInstruction();
        
        // Move to next instruction
        this.currentInstructionIndex = (this.currentInstructionIndex + 1) % this.instructions.length;
        this.updateInstructionText();
        
        // If all instructions completed, enable capture
        if (this.completedInstructions.length >= this.instructions.length) {
            // Enable final capture
            this.enableFinalCapture();
        }
    },
    
    // Complete current instruction
    completeCurrentInstruction: function() {
        // Add current instruction to completed list if not already there
        if (!this.completedInstructions.includes(this.currentInstructionIndex)) {
            this.completedInstructions.push(this.currentInstructionIndex);
        }
        
        // Update UI to show progress
        this.updateProgressUI();
    },
    
    // Update progress UI
    updateProgressUI: function() {
        // Calculate progress percentage
        const progress = (this.completedInstructions.length / this.instructions.length) * 100;
        
        // Update progress bar if exists
        const progressBar = document.querySelector('.liveness-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        // Update instruction status
        for (let i = 0; i < this.instructions.length; i++) {
            const instructionStatus = document.querySelector(`.instruction-status-${i}`);
            if (instructionStatus) {
                if (this.completedInstructions.includes(i)) {
                    instructionStatus.classList.add('completed');
                    instructionStatus.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
                } else {
                    instructionStatus.classList.remove('completed');
                    instructionStatus.innerHTML = '<i class="bi bi-circle"></i>';
                }
            }
        }
        
        // If all instructions completed, show success message
        if (this.completedInstructions.length >= this.instructions.length) {
            const successMessage = document.querySelector('.liveness-success-message');
            if (successMessage) {
                successMessage.classList.remove('d-none');
            }
        }
    },
    
    // Enable final capture
    enableFinalCapture: function() {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success mt-3 liveness-success-message';
        successMessage.innerHTML = '<i class="bi bi-check-circle-fill"></i> All liveness checks completed! You can now capture your final verification image.';
        
        // Add to instructions container
        const instructionsContainer = document.querySelector('.liveness-instructions');
        if (instructionsContainer && !document.querySelector('.liveness-success-message')) {
            instructionsContainer.appendChild(successMessage);
        }
        
        // Update capture button
        const captureBtn = document.getElementById('liveness-capture-btn');
        if (captureBtn) {
            captureBtn.textContent = 'Capture Final Verification Image';
            captureBtn.classList.add('btn-success');
            captureBtn.classList.remove('btn-primary');
        }
    },
    
    // Perform liveness verification
    verifyLiveness: function(imageData) {
        return new Promise((resolve, reject) => {
            try {
                // Create processing overlay
                const processingOverlay = this.createProcessingOverlay();
                
                // Simulate processing delay (in a real app, this would be actual liveness verification)
                setTimeout(() => {
                    // Remove processing overlay
                    if (processingOverlay && processingOverlay.parentNode) {
                        processingOverlay.parentNode.removeChild(processingOverlay);
                    }
                    
                    // Verify liveness (in a real app, this would use ML models)
                    const livenessScore = this.calculateLivenessScore();
                    const isLive = livenessScore >= 0.7; // Threshold for liveness
                    
                    resolve({
                        isLive: isLive,
                        score: livenessScore,
                        details: {
                            blinkDetected: true,
                            faceDetected: true,
                            headMovementDetected: true
                        }
                    });
                }, 2000);
            } catch (error) {
                console.error("Error verifying liveness:", error);
                reject(error);
            }
        });
    },
    
    // Create processing overlay
    createProcessingOverlay: function() {
        const overlay = document.createElement('div');
        overlay.className = 'processing-overlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'processing-spinner';
        overlay.appendChild(spinner);
        
        const text = document.createElement('div');
        text.textContent = 'Verifying liveness...';
        overlay.appendChild(text);
        
        // Add to preview container
        const previewContainer = document.querySelector('.preview-container');
        if (previewContainer) {
            previewContainer.appendChild(overlay);
        }
        
        return overlay;
    },
    
    // Calculate liveness score (simulated)
    calculateLivenessScore: function() {
        // In a real application, this would use ML models to calculate a liveness score
        // For this demo, we'll return a random score between 0.7 and 1.0
        return 0.7 + (Math.random() * 0.3);
    }
};

// Initialize liveness check when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize liveness check page
    if (document.getElementById('liveness-capture-btn') && document.getElementById('instruction-text')) {
        // Initialize liveness check
        LivenessCheck.initialize();
        
        // Setup liveness capture
        const livenessCaptureBtn = document.getElementById('liveness-capture-btn');
        const livenessVideo = document.getElementById('liveness-video');
        const livenessCanvas = document.getElementById('liveness-canvas');
        const livenessPreviewImage = document.getElementById('liveness-preview-image');
        const livenessImageData = document.getElementById('livenessImageData');
        
        // Capture liveness image
        if (livenessCaptureBtn && livenessVideo && livenessCanvas && livenessPreviewImage && livenessImageData) {
            livenessCaptureBtn.addEventListener('click', function() {
                // Draw video frame to canvas
                const context = livenessCanvas.getContext('2d');
                livenessCanvas.width = livenessVideo.videoWidth;
                livenessCanvas.height = livenessVideo.videoHeight;
                context.drawImage(livenessVideo, 0, 0, livenessCanvas.width, livenessCanvas.height);
                
                // Get image data
                const imageData = livenessCanvas.toDataURL('image/png');
                
                // Set preview image
                livenessPreviewImage.src = imageData;
                
                // Set form data
                livenessImageData.value = imageData;
                
                // Show preview container, hide capture container
                document.getElementById('liveness-capture-container').classList.add('d-none');
                document.getElementById('liveness-preview-container').classList.remove('d-none');
                
                // Verify liveness
                LivenessCheck.verifyLiveness(imageData)
                    .then(result => {
                        // Display result
                        const resultContainer = document.createElement('div');
                        resultContainer.className = 'alert ' + (result.isLive ? 'alert-success' : 'alert-danger');
                        resultContainer.innerHTML = result.isLive ? 
                            '<i class="bi bi-check-circle-fill"></i> Liveness verified successfully!' : 
                            '<i class="bi bi-x-circle-fill"></i> Liveness verification failed!';
                        
                        // Add to preview container
                        const previewContainer = document.getElementById('liveness-preview-container');
                        if (previewContainer) {
                            // Remove any existing result
                            const existingResult = previewContainer.querySelector('.alert');
                            if (existingResult) {
                                existingResult.remove();
                            }
                            
                            // Add new result before the buttons
                            const buttonsContainer = previewContainer.querySelector('.d-flex');
                            if (buttonsContainer) {
                                previewContainer.insertBefore(resultContainer, buttonsContainer);
                            } else {
                                previewContainer.appendChild(resultContainer);
                            }
                        }
                    })
                    .catch(error => {
                        console.error("Error verifying liveness:", error);
                    });
            });
        }
        
        // Setup retake button
        const retakeBtn = document.getElementById('liveness-retake-btn');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', function() {
                // Show capture container, hide preview container
                document.getElementById('liveness-capture-container').classList.remove('d-none');
                document.getElementById('liveness-preview-container').classList.add('d-none');
                
                // Clear form data
                if (livenessImageData) {
                    livenessImageData.value = '';
                }
            });
        }
    }
});
