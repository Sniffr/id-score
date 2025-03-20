/**
 * ID Card Detection utility using OpenCV.js
 * Provides enhanced document detection and positioning guidance
 */

// ID Card Detection utilities
const IdCardDetection = {
    // OpenCV loaded status
    cvLoaded: false,
    
    // Previous frame for motion detection
    previousFrame: null,
    
    // Initialize OpenCV
    initialize: function() {
        return new Promise((resolve, reject) => {
            if (this.cvLoaded) {
                resolve();
                return;
            }
            
            // Check if OpenCV is loaded
            if (typeof cv !== 'undefined') {
                console.log('OpenCV.js is loaded');
                this.cvLoaded = true;
                resolve();
            } else {
                // Wait for OpenCV to load
                const interval = setInterval(() => {
                    if (typeof cv !== 'undefined') {
                        console.log('OpenCV.js is loaded');
                        this.cvLoaded = true;
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (!this.cvLoaded) {
                        clearInterval(interval);
                        console.error('OpenCV.js failed to load');
                        reject(new Error('OpenCV.js failed to load'));
                    }
                }, 10000);
            }
        });
    },
    
    // Detect ID card in video frame
    detectIdCard: function(videoElement, canvasElement, guideElement) {
        if (!this.cvLoaded || !videoElement || !canvasElement) {
            return { detected: false, message: 'Detection not ready' };
        }
        
        try {
            // Get video dimensions
            const videoWidth = videoElement.videoWidth;
            const videoHeight = videoElement.videoHeight;
            
            // Check if video is ready
            if (videoWidth === 0 || videoHeight === 0) {
                return { detected: false, message: 'Camera not ready' };
            }
            
            // Create canvas for OpenCV processing
            const context = canvasElement.getContext('2d');
            canvasElement.width = videoWidth;
            canvasElement.height = videoHeight;
            
            // Draw current video frame to canvas
            context.drawImage(videoElement, 0, 0, videoWidth, videoHeight);
            
            // Get the guide position relative to video
            const videoRect = videoElement.getBoundingClientRect();
            const guideRect = guideElement.getBoundingClientRect();
            
            // Calculate guide position in image coordinates
            const scaleX = videoWidth / videoRect.width;
            const scaleY = videoHeight / videoRect.height;
            
            const guideLeft = (guideRect.left - videoRect.left) * scaleX;
            const guideTop = (guideRect.top - videoRect.top) * scaleY;
            const guideWidth = guideRect.width * scaleX;
            const guideHeight = guideRect.height * scaleY;
            
            // Create OpenCV matrices
            const src = cv.imread(canvasElement);
            const gray = new cv.Mat();
            const edges = new cv.Mat();
            
            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            
            // Apply Gaussian blur to reduce noise
            cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
            
            // Use Canny edge detector
            cv.Canny(gray, edges, 75, 200);
            
            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            // Find the largest rectangular contour (potential ID card)
            let maxArea = 0;
            let maxIdx = -1;
            let maxRect = null;
            
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > maxArea) {
                    // Approximate the contour to a polygon
                    const perimeter = cv.arcLength(contour, true);
                    const approx = new cv.Mat();
                    cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
                    
                    // Check if the polygon has 4 points (rectangle)
                    if (approx.rows === 4) {
                        maxArea = area;
                        maxIdx = i;
                        
                        // Get the bounding rect
                        maxRect = cv.boundingRect(contour);
                    }
                    
                    approx.delete();
                }
            }
            
            // Check if we found a potential ID card
            if (maxRect) {
                // Check position relative to guide
                const cardCenterX = maxRect.x + maxRect.width / 2;
                const cardCenterY = maxRect.y + maxRect.height / 2;
                const guideCenterX = guideLeft + guideWidth / 2;
                const guideCenterY = guideTop + guideHeight / 2;
                
                // Calculate ratios for size comparison
                const widthRatio = maxRect.width / guideWidth;
                const heightRatio = maxRect.height / guideHeight;
                
                // Check for motion if we have a previous frame
                let isMoving = false;
                if (this.previousFrame) {
                    isMoving = this.detectMotion(src, this.previousFrame);
                }
                
                // Save current frame for next comparison
                this.previousFrame = src.clone();
                
                // Determine position guidance
                if (isMoving) {
                    // Clean up OpenCV resources
                    gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
                    
                    return {
                        detected: true,
                        isValid: false,
                        isMoving: true,
                        rect: maxRect,
                        message: 'Hold still - ID is moving'
                    };
                } else if (widthRatio < 0.7 || heightRatio < 0.7) {
                    // ID is too small
                    // Clean up OpenCV resources
                    gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
                    
                    return {
                        detected: true,
                        isValid: false,
                        isTooSmall: true,
                        rect: maxRect,
                        message: 'Move ID card closer'
                    };
                } else if (widthRatio > 1.2 || heightRatio > 1.2) {
                    // ID is too big
                    // Clean up OpenCV resources
                    gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
                    
                    return {
                        detected: true,
                        isValid: false,
                        isTooBig: true,
                        rect: maxRect,
                        message: 'Move ID card further away'
                    };
                } else if (cardCenterX < guideCenterX - guideWidth * 0.1) {
                    // ID is too far left
                    // Clean up OpenCV resources
                    gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
                    
                    return {
                        detected: true,
                        isValid: false,
                        isTooLeft: true,
                        rect: maxRect,
                        message: 'Move ID card to the right'
                    };
                } else if (cardCenterX > guideCenterX + guideWidth * 0.1) {
                    // ID is too far right
                    // Clean up OpenCV resources
                    gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
                    
                    return {
                        detected: true,
                        isValid: false,
                        isTooRight: true,
                        rect: maxRect,
                        message: 'Move ID card to the left'
                    };
                } else if (cardCenterY < guideCenterY - guideHeight * 0.1) {
                    // ID is too high
                    // Clean up OpenCV resources
                    gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
                    
                    return {
                        detected: true,
                        isValid: false,
                        isTooHigh: true,
                        rect: maxRect,
                        message: 'Move ID card down'
                    };
                } else if (cardCenterY > guideCenterY + guideHeight * 0.1) {
                    // ID is too low
                    // Clean up OpenCV resources
                    gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
                    
                    return {
                        detected: true,
                        isValid: false,
                        isTooLow: true,
                        rect: maxRect,
                        message: 'Move ID card up'
                    };
                } else {
                    // ID is correctly positioned
                    // Check image quality
                    const hasGoodQuality = this.checkImageQuality(gray, maxRect);
                    
                    // Clean up OpenCV resources
                    gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
                    
                    if (!hasGoodQuality) {
                        return {
                            detected: true,
                            isValid: false,
                            hasLowQuality: true,
                            rect: maxRect,
                            message: 'Improve lighting for better readability'
                        };
                    }
                    
                    return {
                        detected: true,
                        isValid: true,
                        rect: maxRect,
                        message: 'Perfect! Hold still for capture'
                    };
                }
            } else {
                // No ID card detected
                // Clean up OpenCV resources
                gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
                src.delete();
                
                return {
                    detected: false,
                    message: 'No ID card detected - Position card in frame'
                };
            }
        } catch (error) {
            console.error('Error in ID card detection:', error);
            return {
                detected: false,
                message: 'Error detecting ID card'
            };
        }
    },
    
    // Detect motion between frames
    detectMotion: function(currentFrame, previousFrame) {
        // Calculate absolute difference between frames
        const diff = new cv.Mat();
        cv.absdiff(currentFrame, previousFrame, diff);
        
        // Convert to grayscale
        const grayDiff = new cv.Mat();
        cv.cvtColor(diff, grayDiff, cv.COLOR_RGBA2GRAY);
        
        // Apply threshold
        const thresholdDiff = new cv.Mat();
        cv.threshold(grayDiff, thresholdDiff, 25, 255, cv.THRESH_BINARY);
        
        // Calculate non-zero pixels (motion)
        const motionPixels = cv.countNonZero(thresholdDiff);
        
        // Clean up
        diff.delete();
        grayDiff.delete();
        thresholdDiff.delete();
        
        // If more than 1% of pixels changed, consider it as motion
        const motionThreshold = (currentFrame.rows * currentFrame.cols) * 0.01;
        return motionPixels > motionThreshold;
    },
    
    // Check image quality for readability
    checkImageQuality: function(grayImage, rect) {
        // Extract the ID card region
        const idRegion = grayImage.roi(rect);
        
        // Calculate histogram to check contrast
        const hist = new cv.Mat();
        const mask = new cv.Mat();
        const histSize = [256];
        const ranges = [0, 256];
        const channels = [0];
        
        cv.calcHist([idRegion], channels, mask, hist, histSize, ranges);
        
        // Calculate standard deviation of pixel values (for contrast)
        const mean = new cv.Mat();
        const stdDev = new cv.Mat();
        cv.meanStdDev(idRegion, mean, stdDev);
        
        // Clean up
        idRegion.delete();
        hist.delete();
        mask.delete();
        mean.delete();
        
        // Check if standard deviation is high enough (good contrast)
        const contrast = stdDev.data64F[0];
        stdDev.delete();
        
        return contrast > 30; // Threshold for good contrast
    }
};
