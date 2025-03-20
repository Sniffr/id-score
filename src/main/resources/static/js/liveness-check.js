/**
 * Automated Liveness Check functionality for Kenyan ID Verification System
 * Provides enhanced liveness detection and verification using face-api.js
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
    
    // Face detection values
    previousFace: null,
    blinkDetected: false,
    rightTurnDetected: false,
    leftTurnDetected: false,
    smileDetected: false,
    faceDetected: false,
    
    // Detection counters
    blinkCounter: 0,
    rightTurnCounter: 0,
    leftTurnCounter: 0,
    smileCounter: 0,
    
    // Detection thresholds
    BLINK_THRESHOLD: 3,
    HEAD_TURN_THRESHOLD: 5,
    SMILE_THRESHOLD: 3,
    
    // Detection intervals
    faceDetectionInterval: null,
    
    // Initialize liveness check
    initialize: function() {
        // Set first instruction
        this.updateInstructionText();
        
        // Hide manual next button
        const nextInstructionBtn = document.getElementById('next-instruction-btn');
        if (nextInstructionBtn) {
            nextInstructionBtn.style.display = 'none';
        }
        
        // Initialize face detection
        this.initFaceDetection();
    },
    
    // Initialize face detection
    initFaceDetection: async function() {
        try {
            // Initialize FaceDetection utility
            await FaceDetection.initialize();
            
            // Get video element
            const video = document.getElementById('liveness-video');
            if (!video) return;
            
            // Start face detection loop
            this.startFaceDetection(video);
        } catch (error) {
            console.error("Face detection initialization error:", error);
        }
    },
    
    // Start face detection loop
    startFaceDetection: function(videoElement) {
        this.faceDetectionInterval = setInterval(async () => {
            if (videoElement.readyState === 4) {
                try {
                    // Detect face in current video frame
                    const faceDetection = await FaceDetection.detectFace(videoElement);
                    
                    if (faceDetection) {
                        this.faceDetected = true;
                        
                        // Process detected face based on current instruction
                        this.processFaceDetection(faceDetection);
                    } else {
                        this.faceDetected = false;
                    }
                    
                    // Update UI based on detection
                    this.updateDetectionUI();
                    
                    // Stop interval if all checks completed
                    if (this.completedInstructions.length >= this.instructions.length) {
                        clearInterval(this.faceDetectionInterval);
                        this.enableFinalCapture();
                    }
                } catch (error) {
                    console.error("Face detection error:", error);
                }
            }
        }, 100);
    },
    
    // Process face detection results
    processFaceDetection: function(detection) {
        // Store previous face for comparison
        const currentFace = detection;
        
        // Process based on current instruction
        switch (this.currentInstructionIndex) {
            case 0: // Look straight at camera
                if (this.isFaceCentered(detection)) {
                    this.completeCurrentInstruction();
                    this.moveToNextInstruction();
                }
                break;
                
            case 1: // Blink eyes
                if (this.previousFace && FaceDetection.detectBlink(detection.landmarks)) {
                    this.blinkCounter++;
                    if (this.blinkCounter >= this.BLINK_THRESHOLD) {
                        this.blinkDetected = true;
                        this.completeCurrentInstruction();
                        this.moveToNextInstruction();
                    }
                }
                break;
                
            case 2: // Turn head right
                if (this.previousFace) {
                    const movement = this.detectHeadMovement(currentFace, this.previousFace);
                    if (movement === 'right') {
                        this.rightTurnCounter++;
                        if (this.rightTurnCounter >= this.HEAD_TURN_THRESHOLD) {
                            this.rightTurnDetected = true;
                            this.completeCurrentInstruction();
                            this.moveToNextInstruction();
                        }
                    }
                }
                break;
                
            case 3: // Turn head left
                if (this.previousFace) {
                    const movement = this.detectHeadMovement(currentFace, this.previousFace);
                    if (movement === 'left') {
                        this.leftTurnCounter++;
                        if (this.leftTurnCounter >= this.HEAD_TURN_THRESHOLD) {
                            this.leftTurnDetected = true;
                            this.completeCurrentInstruction();
                            this.moveToNextInstruction();
                        }
                    }
                }
                break;
                
            case 4: // Smile
                if (detection.expressions && detection.expressions.happy > 0.7) {
                    this.smileCounter++;
                    if (this.smileCounter >= this.SMILE_THRESHOLD) {
                        this.smileDetected = true;
                        this.completeCurrentInstruction();
                        this.moveToNextInstruction();
                    }
                }
                break;
        }
        
        // Update previous face
        this.previousFace = currentFace;
    },
    
    // Check if face is centered in frame
    isFaceCentered: function(detection) {
        if (!detection || !detection.detection) return false;
        
        const box = detection.detection.box;
        const videoElement = document.getElementById('liveness-video');
        
        if (!videoElement) return false;
        
        // Calculate center of face
        const faceCenterX = box.x + (box.width / 2);
        const faceCenterY = box.y + (box.height / 2);
        
        // Calculate center of video
        const videoCenterX = videoElement.videoWidth / 2;
        const videoCenterY = videoElement.videoHeight / 2;
        
        // Calculate distance from center
        const distanceX = Math.abs(faceCenterX - videoCenterX);
        const distanceY = Math.abs(faceCenterY - videoCenterY);
        
        // Check if face is centered (within 20% of center)
        const maxDistanceX = videoElement.videoWidth * 0.2;
        const maxDistanceY = videoElement.videoHeight * 0.2;
        
        return distanceX < maxDistanceX && distanceY < maxDistanceY;
    },
    
    // Detect head movement direction
    detectHeadMovement: function(currentFace, previousFace) {
        if (!currentFace || !previousFace || 
            !currentFace.landmarks || !previousFace.landmarks) {
            return 'none';
        }
        
        try {
            // Get nose position from landmarks
            const currentNose = currentFace.landmarks.getNose()[0];
            const previousNose = previousFace.landmarks.getNose()[0];
            
            // Calculate movement
            const xDiff = currentNose.x - previousNose.x;
            
            // Determine direction
            if (xDiff > 5) {
                return 'right';
            } else if (xDiff < -5) {
                return 'left';
            }
            
            return 'none';
        } catch (error) {
            console.error("Error detecting head movement:", error);
            return 'none';
        }
    },
    
    // Move to next instruction
    moveToNextInstruction: function() {
        // Reset counters for next instruction
        this.blinkCounter = 0;
        this.rightTurnCounter = 0;
        this.leftTurnCounter = 0;
        this.smileCounter = 0;
        
        // Move to next instruction
        this.currentInstructionIndex = (this.currentInstructionIndex + 1) % this.instructions.length;
        this.updateInstructionText();
    },
    
    // Update instruction text
    updateInstructionText: function() {
        const instructionText = document.getElementById('instruction-text');
        if (instructionText) {
            instructionText.textContent = this.instructions[this.currentInstructionIndex];
            
            // Add animation class
            instructionText.classList.remove('blink-animation');
            void instructionText.offsetWidth; // Trigger reflow
            instructionText.classList.add('blink-animation');
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
    },
    
    // Update detection UI
    updateDetectionUI: function() {
        // Update face detection status
        const faceGuide = document.querySelector('.face-guide');
        if (faceGuide) {
            if (this.faceDetected) {
                faceGuide.style.border = '2px solid #28a745';
            } else {
                faceGuide.style.border = '2px dashed #dc3545';
            }
        }
        
        // Update current instruction status based on detection
        switch (this.currentInstructionIndex) {
            case 0: // Look straight
                this.updateInstructionStatus(this.faceDetected && this.isFaceCentered(this.previousFace));
                break;
                
            case 1: // Blink
                this.updateInstructionStatus(this.blinkCounter > 0, 
                    `Blink detected: ${this.blinkCounter}/${this.BLINK_THRESHOLD}`);
                break;
                
            case 2: // Turn right
                this.updateInstructionStatus(this.rightTurnCounter > 0, 
                    `Right turn: ${this.rightTurnCounter}/${this.HEAD_TURN_THRESHOLD}`);
                break;
                
            case 3: // Turn left
                this.updateInstructionStatus(this.leftTurnCounter > 0, 
                    `Left turn: ${this.leftTurnCounter}/${this.HEAD_TURN_THRESHOLD}`);
                break;
                
            case 4: // Smile
                this.updateInstructionStatus(this.smileCounter > 0, 
                    `Smile detected: ${this.smileCounter}/${this.SMILE_THRESHOLD}`);
                break;
        }
    },
    
    // Update instruction status
    updateInstructionStatus: function(isActive, statusText) {
        const instructionText = document.getElementById('instruction-text');
        if (instructionText) {
            if (isActive) {
                instructionText.classList.add('text-success');
                instructionText.classList.remove('text-danger');
            } else {
                instructionText.classList.remove('text-success');
                instructionText.classList.add('text-danger');
            }
            
            // Add status text if provided
            if (statusText) {
                const statusElement = document.querySelector('.detection-status');
                if (statusElement) {
                    statusElement.textContent = statusText;
                    statusElement.style.display = 'block';
                } else {
                    // Create status element if it doesn't exist
                    const newStatusElement = document.createElement('div');
                    newStatusElement.className = 'detection-status small text-muted mt-2';
                    newStatusElement.textContent = statusText;
                    
                    // Add after instruction text
                    const instructionContainer = instructionText.parentElement;
                    if (instructionContainer) {
                        instructionContainer.appendChild(newStatusElement);
                    }
                }
            }
        }
    },
    
    // Enable final capture
    enableFinalCapture: function() {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success mt-3 liveness-success-message';
        successMessage.innerHTML = '<i class="bi bi-check-circle-fill"></i> All liveness checks completed automatically! You can now capture your final verification image.';
        
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
            captureBtn.disabled = false;
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
                    
                    // Use completed instructions as verification result
                    const isLive = this.completedInstructions.length >= this.instructions.length;
                    const livenessScore = isLive ? 0.9 : 0.5;
                    
                    resolve({
                        isLive: isLive,
                        score: livenessScore,
                        details: {
                            blinkDetected: this.blinkDetected,
                            faceDetected: this.faceDetected,
                            rightTurnDetected: this.rightTurnDetected,
                            leftTurnDetected: this.leftTurnDetected,
                            smileDetected: this.smileDetected
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
    
    // Clean up resources
    cleanup: function() {
        if (this.faceDetectionInterval) {
            clearInterval(this.faceDetectionInterval);
            this.faceDetectionInterval = null;
        }
    }
};
