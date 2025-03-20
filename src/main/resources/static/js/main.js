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

// Camera initialization for ID capture
function initializeCamera() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const previewImage = document.getElementById('preview-image');
    const retakeBtn = document.getElementById('retake-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const captureContainer = document.getElementById('capture-container');
    const previewContainer = document.getElementById('preview-container');
    
    let currentFacingMode = "user"; // Default to front camera
    let cameraStream = null;
    let idCardGuide = null;
    
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
    
    // Initialize camera with enhanced settings
    CameraUtils.initCamera(video)
        .then(stream => {
            cameraStream = stream;
            // Apply ID card guides
            idCardGuide = CameraUtils.applyIdCardGuides(video);
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
            document.getElementById('capturedImageData').value = imageDataUrl;
            
            // Stop camera stream when in preview mode to save resources
            CameraUtils.stopStream(cameraStream);
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
