// Main JavaScript file for the Kenyan ID Verification System

document.addEventListener('DOMContentLoaded', function() {
    console.log('ID Verification System initialized');
    
    // Initialize camera functionality if on the capture page
    if (document.getElementById('video')) {
        initializeCamera();
    }
    
    // Initialize liveness check if on the liveness page
    if (document.getElementById('liveness-video')) {
        initializeLivenessCheck();
    }
});

// Camera initialization for ID capture with real-time validation
function initializeCamera() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const previewImage = document.getElementById('preview-image');
    const retakeBtn = document.getElementById('retake-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const captureContainer = document.getElementById('capture-container');
    const previewContainer = document.getElementById('preview-container');
    
    let currentFacingMode = "environment"; // Default to rear camera
    let cameraStream = null;
    let idCardGuide = null;
    let validationInterval = null;
    let isIdValid = false;
    let validPositionCounter = 0;
    let autoCaptureEnabled = true;
    let isCapturing = false;
    
    // Add camera switch button if device has multiple cameras
    CameraUtils.hasMultipleCameras().then(hasMultiple => {
        if (hasMultiple && captureContainer) {
            const switchBtn = document.createElement('button');
            switchBtn.type = 'button';
            switchBtn.className = 'btn btn-outline-light position-absolute';
            switchBtn.style.bottom = '20px';
            switchBtn.style.right = '20px';
            switchBtn.style.zIndex = '20';
            switchBtn.innerHTML = '<i class="bi bi-camera-switch"></i> Switch Camera';
            
            switchBtn.addEventListener('click', function() {
                CameraUtils.switchCamera(video, currentFacingMode)
                    .then(newFacingMode => {
                        currentFacingMode = newFacingMode;
                    })
                    .catch(error => {
                        console.error("Error switching camera:", error);
                    });
            });
            
            captureContainer.appendChild(switchBtn);
        }
    });
    
    // Set up auto-capture toggle button
    const toggleAutoCaptureBtn = document.getElementById('toggle-autocapture');
    if (toggleAutoCaptureBtn) {
        toggleAutoCaptureBtn.addEventListener('click', function() {
            autoCaptureEnabled = !autoCaptureEnabled;
            
            if (autoCaptureEnabled) {
                toggleAutoCaptureBtn.classList.add('active');
                toggleAutoCaptureBtn.innerHTML = '<i class="bi bi-magic"></i> Auto-Capture: ON';
            } else {
                toggleAutoCaptureBtn.classList.remove('active');
                toggleAutoCaptureBtn.innerHTML = '<i class="bi bi-magic"></i> Auto-Capture: OFF';
                
                // Reset counter when disabled
                validPositionCounter = 0;
            }
        });
    }
    
    // Initialize camera with enhanced settings
    CameraUtils.initCamera(video)
        .then(stream => {
            cameraStream = stream;
            // Apply ID card guides
            idCardGuide = CameraUtils.applyIdCardGuides(video);
            
            // Start real-time validation
            validationInterval = setInterval(() => {
                if (video.readyState === 4) {
                    isIdValid = IdCapture.validateIdCardRealTime(video, canvas, idCardGuide);
                    
                    // Update capture button based on validation
                    if (captureBtn) {
                        if (isIdValid) {
                            captureBtn.classList.remove('btn-secondary');
                            captureBtn.classList.add('btn-primary');
                            captureBtn.disabled = false;
                            
                            // If ID is valid and still, increment counter for auto-capture
                            if (autoCaptureEnabled && !isCapturing) {
                                validPositionCounter++;
                                
                                // After 2 seconds of stable position, auto-capture
                                if (validPositionCounter >= 4) { // 500ms interval * 4 = 2 seconds
                                    isCapturing = true;
                                    
                                    // Add "Capturing..." text to the button
                                    captureBtn.innerHTML = '<i class="bi bi-camera"></i> Capturing...';
                                    
                                    // Trigger capture after a short delay
                                    setTimeout(() => {
                                        if (isIdValid) {
                                            // Simulate button click to capture
                                            captureBtn.click();
                                        } else {
                                            // Reset if position is lost during delay
                                            isCapturing = false;
                                            captureBtn.innerHTML = '<i class="bi bi-camera"></i> Capture Front of ID';
                                        }
                                    }, 500);
                                }
                            }
                        } else {
                            captureBtn.classList.remove('btn-primary');
                            captureBtn.classList.add('btn-secondary');
                            captureBtn.disabled = true;
                            
                            // Reset counter if position is lost
                            validPositionCounter = 0;
                            isCapturing = false;
                            captureBtn.innerHTML = '<i class="bi bi-camera"></i> Capture Front of ID';
                        }
                    }
                }
            }, 500);
        })
        .catch(error => {
            console.error("Camera error:", error);
            alert("Error accessing the camera: " + error.message);
        });
    
    // Clean up interval when leaving the page
    window.addEventListener('beforeunload', () => {
        if (validationInterval) {
            clearInterval(validationInterval);
        }
    });
    
    // Capture image when button is clicked
    if (captureBtn) {
        captureBtn.addEventListener('click', function() {
            // Use camera utils to capture image
            const imageDataUrl = CameraUtils.captureImage(video, canvas);
            
            // Show preview
            previewImage.src = imageDataUrl;
            captureContainer.classList.add('d-none');
            previewContainer.classList.remove('d-none');
            
            // Set the captured image data in the hidden input
            document.getElementById('capturedImageData').value = imageDataUrl;
            
            // Stop camera stream when in preview mode to save resources
            CameraUtils.stopStream(cameraStream);
            
            // Clear validation interval
            if (validationInterval) {
                clearInterval(validationInterval);
                validationInterval = null;
            }
        });
    }
    
    // Retake photo
    if (retakeBtn) {
        retakeBtn.addEventListener('click', function() {
            captureContainer.classList.remove('d-none');
            previewContainer.classList.add('d-none');
            document.getElementById('capturedImageData').value = '';
            
            // Reinitialize camera
            CameraUtils.initCamera(video)
                .then(stream => {
                    cameraStream = stream;
                    
                    // Restart validation interval
                    if (!validationInterval) {
                        validationInterval = setInterval(() => {
                            if (video.readyState === 4) {
                                isIdValid = IdCapture.validateIdCardRealTime(video, canvas, idCardGuide);
                                
                                // Update capture button based on validation
                                if (captureBtn) {
                                    if (isIdValid) {
                                        captureBtn.classList.remove('btn-secondary');
                                        captureBtn.classList.add('btn-primary');
                                        captureBtn.disabled = false;
                                    } else {
                                        captureBtn.classList.remove('btn-primary');
                                        captureBtn.classList.add('btn-secondary');
                                        captureBtn.disabled = true;
                                    }
                                }
                            }
                        }, 500);
                    }
                })
                .catch(error => {
                    console.error("Camera error:", error);
                });
        });
    }
}

// Liveness check initialization
function initializeLivenessCheck() {
    const video = document.getElementById('liveness-video');
    const canvas = document.getElementById('liveness-canvas');
    const captureBtn = document.getElementById('liveness-capture-btn');
    const instructionText = document.getElementById('instruction-text');
    const previewImage = document.getElementById('liveness-preview-image');
    const retakeBtn = document.getElementById('liveness-retake-btn');
    const confirmBtn = document.getElementById('liveness-confirm-btn');
    const captureContainer = document.getElementById('liveness-capture-container');
    const previewContainer = document.getElementById('liveness-preview-container');
    
    let currentInstruction = 0;
    let cameraStream = null;
    let faceGuide = null;
    
    const instructions = [
        "Look straight at the camera",
        "Blink your eyes slowly",
        "Turn your head slightly to the right",
        "Turn your head slightly to the left",
        "Smile for the camera"
    ];
    
    // Initialize camera with enhanced settings
    CameraUtils.initCamera(video)
        .then(stream => {
            cameraStream = stream;
            // Apply face guides
            faceGuide = CameraUtils.applyFaceGuides(video);
            
            // Update instruction
            if (instructionText) {
                instructionText.textContent = instructions[currentInstruction];
            }
        })
        .catch(error => {
            console.error("Camera error:", error);
            alert("Error accessing the camera: " + error.message);
        });
    
    // Capture image when button is clicked
    if (captureBtn) {
        captureBtn.addEventListener('click', function() {
            // Use camera utils to capture image
            const imageDataUrl = CameraUtils.captureImage(video, canvas);
            
            // Show preview
            previewImage.src = imageDataUrl;
            captureContainer.classList.add('d-none');
            previewContainer.classList.remove('d-none');
            
            // Set the captured image data in the hidden input
            document.getElementById('livenessImageData').value = imageDataUrl;
            
            // Stop camera stream when in preview mode to save resources
            CameraUtils.stopStream(cameraStream);
        });
    }
    
    // Retake photo
    if (retakeBtn) {
        retakeBtn.addEventListener('click', function() {
            captureContainer.classList.remove('d-none');
            previewContainer.classList.add('d-none');
            document.getElementById('livenessImageData').value = '';
            
            // Reinitialize camera
            CameraUtils.initCamera(video)
                .then(stream => {
                    cameraStream = stream;
                    
                    // Update instruction
                    if (instructionText) {
                        instructionText.textContent = instructions[currentInstruction];
                    }
                })
                .catch(error => {
                    console.error("Camera error:", error);
                });
        });
    }
    
    // Next instruction button
    const nextInstructionBtn = document.getElementById('next-instruction-btn');
    if (nextInstructionBtn) {
        nextInstructionBtn.addEventListener('click', function() {
            currentInstruction = (currentInstruction + 1) % instructions.length;
            instructionText.textContent = instructions[currentInstruction];
        });
    }
}
