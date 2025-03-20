// Face detection utilities
const FaceDetection = {
    // Models loaded status
    modelsLoaded: false,
    
    // Initialize face detection
    initialize: async function() {
        if (this.modelsLoaded) return Promise.resolve();
        
        try {
            // Load required face-api.js models
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/js/face-api-models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/js/face-api-models'),
                faceapi.nets.faceExpressionNet.loadFromUri('/js/face-api-models')
            ]);
            console.log('Face detection models loaded');
            this.modelsLoaded = true;
            return Promise.resolve();
        } catch (error) {
            console.error('Error loading face detection models:', error);
            return Promise.reject(error);
        }
    },
    
    // Detect face in video stream
    detectFace: async function(videoElement) {
        if (!this.modelsLoaded) await this.initialize();
        
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
        const result = await faceapi.detectSingleFace(videoElement, options)
            .withFaceLandmarks()
            .withFaceExpressions();
        
        return result;
    },
    
    // Check if eyes are blinking
    detectBlink: function(landmarks) {
        if (!landmarks) return false;
        
        // Get eye landmarks
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        // Calculate eye aspect ratios
        const leftEAR = this.calculateEyeAspectRatio(leftEye);
        const rightEAR = this.calculateEyeAspectRatio(rightEye);
        
        // Average eye aspect ratio
        const ear = (leftEAR + rightEAR) / 2.0;
        
        // Threshold for blink detection
        return ear < 0.2;
    },
    
    // Calculate eye aspect ratio for blink detection
    calculateEyeAspectRatio: function(eye) {
        // Calculate vertical distances
        const v1 = this.calculateDistance(eye[1], eye[5]);
        const v2 = this.calculateDistance(eye[2], eye[4]);
        
        // Calculate horizontal distance
        const h = this.calculateDistance(eye[0], eye[3]);
        
        // Calculate eye aspect ratio
        return (v1 + v2) / (2.0 * h);
    },
    
    // Calculate distance between two points
    calculateDistance: function(pointA, pointB) {
        return Math.sqrt(
            Math.pow(pointA.x - pointB.x, 2) + 
            Math.pow(pointA.y - pointB.y, 2)
        );
    },
    
    // Detect head movement direction
    detectHeadMovement: function(currentLandmarks, previousLandmarks) {
        if (!currentLandmarks || !previousLandmarks) return 'none';
        
        // Calculate nose position change
        const nose = currentLandmarks.getNose()[0];
        const prevNose = previousLandmarks.getNose()[0];
        
        const xDiff = nose.x - prevNose.x;
        
        // Determine movement direction
        if (xDiff > 10) {
            return 'right';
        } else if (xDiff < -10) {
            return 'left';
        }
        
        return 'none';
    }
};
