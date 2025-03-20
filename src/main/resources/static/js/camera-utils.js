/**
 * Camera utilities for Kenyan ID Verification System
 * Provides enhanced camera functionality for ID capture and liveness checks
 */

// Camera constraints for better quality
const cameraConstraints = {
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "environment" // Default to rear camera
    }
};

// Camera utilities object
const CameraUtils = {
    // Initialize camera with specific constraints
    initCamera: function(videoElement, constraints = cameraConstraints) {
        return new Promise((resolve, reject) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                reject(new Error("Your browser does not support camera access"));
                return;
            }
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    videoElement.srcObject = stream;
                    videoElement.onloadedmetadata = () => {
                        videoElement.play();
                        resolve(stream);
                    };
                })
                .catch(error => {
                    console.error("Camera error:", error);
                    reject(error);
                });
        });
    },
    
    // Switch between front and back camera
    switchCamera: function(videoElement, currentFacingMode) {
        // Stop current stream
        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
        
        // Toggle facing mode
        const newFacingMode = currentFacingMode === "user" ? "environment" : "user";
        
        // Create new constraints
        const newConstraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: newFacingMode
            }
        };
        
        // Initialize camera with new constraints
        return this.initCamera(videoElement, newConstraints)
            .then(() => newFacingMode);
    },
    
    // Capture image from video stream
    captureImage: function(videoElement, canvasElement) {
        const context = canvasElement.getContext('2d');
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        // Return base64 image data
        return canvasElement.toDataURL('image/png');
    },
    
    // Apply visual guides for ID card placement with validation support
    applyIdCardGuides: function(videoElement, guideElement) {
        // Create guide overlay if it doesn't exist
        if (!guideElement) {
            guideElement = document.createElement('div');
            guideElement.className = 'id-card-guide';
            guideElement.style.position = 'absolute';
            guideElement.style.top = '50%';
            guideElement.style.left = '50%';
            guideElement.style.transform = 'translate(-50%, -50%)';
            guideElement.style.width = '85%';
            guideElement.style.height = '55%';
            guideElement.style.border = '2px dashed #fff';
            guideElement.style.borderRadius = '10px';
            guideElement.style.boxShadow = '0 0 0 2000px rgba(0, 0, 0, 0.3)';
            guideElement.style.zIndex = '10';
            guideElement.style.transition = 'all 0.3s ease-in-out';
            
            // Add guide text
            const guideText = document.createElement('div');
            guideText.textContent = 'Position ID card within the frame';
            guideText.style.position = 'absolute';
            guideText.style.bottom = '-40px';
            guideText.style.left = '0';
            guideText.style.width = '100%';
            guideText.style.textAlign = 'center';
            guideText.style.color = '#fff';
            guideText.style.fontWeight = 'bold';
            guideText.style.fontSize = '16px';
            guideText.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            guideText.style.padding = '8px 0';
            guideText.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.7)';
            guideText.style.transition = 'all 0.3s ease-in-out';
            guideElement.appendChild(guideText);
            
            // Add validation status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'validation-status';
            statusIndicator.style.position = 'absolute';
            statusIndicator.style.top = '-40px';
            statusIndicator.style.left = '50%';
            statusIndicator.style.transform = 'translateX(-50%)';
            statusIndicator.style.padding = '5px 10px';
            statusIndicator.style.borderRadius = '20px';
            statusIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            statusIndicator.style.color = '#fff';
            statusIndicator.style.display = 'none';
            statusIndicator.style.transition = 'all 0.3s ease-in-out';
            statusIndicator.style.fontWeight = 'bold';
            statusIndicator.style.fontSize = '14px';
            guideElement.appendChild(statusIndicator);
            
            // Add to video container
            videoElement.parentElement.style.position = 'relative';
            videoElement.parentElement.appendChild(guideElement);
        }
        
        return guideElement;
    },
    
    // Apply face detection guides for liveness check
    applyFaceGuides: function(videoElement, guideElement) {
        // Create guide overlay if it doesn't exist
        if (!guideElement) {
            guideElement = document.createElement('div');
            guideElement.className = 'face-guide';
            guideElement.style.position = 'absolute';
            guideElement.style.top = '50%';
            guideElement.style.left = '50%';
            guideElement.style.transform = 'translate(-50%, -50%)';
            guideElement.style.width = '60%';
            guideElement.style.height = '70%';
            guideElement.style.border = '2px dashed #fff';
            guideElement.style.borderRadius = '50%';
            guideElement.style.boxShadow = '0 0 0 2000px rgba(0, 0, 0, 0.3)';
            guideElement.style.zIndex = '10';
            
            // Add guide text
            const guideText = document.createElement('div');
            guideText.textContent = 'Position your face within the oval';
            guideText.style.position = 'absolute';
            guideText.style.bottom = '-30px';
            guideText.style.left = '0';
            guideText.style.width = '100%';
            guideText.style.textAlign = 'center';
            guideText.style.color = '#fff';
            guideText.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.7)';
            guideElement.appendChild(guideText);
            
            // Add to video container
            videoElement.parentElement.style.position = 'relative';
            videoElement.parentElement.appendChild(guideElement);
        }
        
        return guideElement;
    },
    
    // Check if the device has multiple cameras
    hasMultipleCameras: function() {
        return new Promise((resolve) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                resolve(false);
                return;
            }
            
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    resolve(videoDevices.length > 1);
                })
                .catch(() => {
                    resolve(false);
                });
        });
    },
    
    // Stop all tracks in a stream
    stopStream: function(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
};
