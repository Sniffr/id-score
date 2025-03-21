/**
 * ID Document Detection Module
 * Provides functionality for detecting ID documents in camera frames
 * using OpenCV.js for image processing
 */
const IDDocumentDetection = (function() {
    // Module variables
    let isOpenCVLoaded = false;
    let net = null;
    
    // Initialize function
    async function initialize() {
        // Wait for OpenCV to load
        if (typeof cv === 'undefined') {
            return new Promise((resolve) => {
                // OpenCV.js callback when ready
                window.onOpenCVReady = () => {
                    isOpenCVLoaded = true;
                    console.log("OpenCV.js loaded");
                    resolve(true);
                };
            });
        } else {
            isOpenCVLoaded = true;
            console.log("OpenCV.js already loaded");
            return Promise.resolve(true);
        }
    }
    
    // Process frame for document detection
    function processFrame(videoElement, canvasElement, guideElement) {
        if (!isOpenCVLoaded) return null;
        
        const ctx = canvasElement.getContext('2d');
        
        // Draw the current frame
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        // Convert to OpenCV format
        const src = cv.imread(canvasElement);
        
        // Detect document edges using Canny
        const gray = new cv.Mat();
        const edges = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        // Adjust Canny parameters for better detection of Kenyan ID edges
        cv.Canny(gray, edges, 40, 120, 3);
        
        // Find contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // Check for document-like contours
        let maxArea = 0;
        let maxContourIndex = -1;
        
        for (let i = 0; i < contours.size(); ++i) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            if (area > maxArea) {
                maxArea = area;
                maxContourIndex = i;
            }
        }
        
        // Results to return
        let result = {
            isValid: false,
            message: "Position Kenyan ID card within the guide",
            rect: null
        };
        
        // If found a reasonable contour, check if it's document shaped
        if (maxContourIndex >= 0) {
            const maxContour = contours.get(maxContourIndex);
            
            // Get bounding rectangle
            const rect = cv.boundingRect(maxContour);
            
            // Check if size is reasonable (not too small)
            const minArea = canvasElement.width * canvasElement.height * 0.1;
            const isLargeEnough = maxArea > minArea;
            
            // Check if aspect ratio matches Kenyan ID card (more precise range)
            const aspectRatio = rect.width / rect.height;
            const isValidRatio = aspectRatio > 1.5 && aspectRatio < 1.7; // Kenyan ID aspect ratio is approximately 1.6:1
            
            // Position validation
            const guideRect = guideElement.getBoundingClientRect();
            const canvasRect = canvasElement.getBoundingClientRect();
            
            // Convert guide rectangle to canvas coordinates
            const guideCanvasX = (guideRect.left - canvasRect.left) * (canvasElement.width / canvasRect.width);
            const guideCanvasY = (guideRect.top - canvasRect.top) * (canvasElement.height / canvasRect.height);
            const guideCanvasWidth = guideRect.width * (canvasElement.width / canvasRect.width);
            const guideCanvasHeight = guideRect.height * (canvasElement.height / canvasRect.height);
            
            // Check position relative to guide
            const isCentered = Math.abs((rect.x + rect.width/2) - (guideCanvasX + guideCanvasWidth/2)) < guideCanvasWidth * 0.2;
            const isVerticallyAligned = Math.abs((rect.y + rect.height/2) - (guideCanvasY + guideCanvasHeight/2)) < guideCanvasHeight * 0.2;
            
            // Check size relative to guide
            const isTooSmall = rect.width < guideCanvasWidth * 0.7;
            const isTooLarge = rect.width > guideCanvasWidth * 1.2;
            
            // Draw rectangle on canvas
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 4;
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            
            // Set message and validity based on checks
            if (isTooSmall) {
                result.message = "Move closer to the camera";
            } else if (isTooLarge) {
                result.message = "Move farther from the camera";
            } else if (!isCentered) {
                result.message = "Center the ID card";
            } else if (!isVerticallyAligned) {
                result.message = "Align the ID card vertically";
            } else if (isLargeEnough && isValidRatio) {
                // Additional check for Kenyan ID card color
                const hasKenyanIdColor = checkKenyanIdColor(src, rect);
                
                if (hasKenyanIdColor) {
                    result.isValid = true;
                    result.message = "Perfect! Kenyan ID detected. Hold still for capture";
                } else {
                    result.isValid = false;
                    result.message = "ID card detected. Please use a Kenyan National ID";
                }
            }
            
            result.rect = rect;
        }
        
        // Clean up
        src.delete();
        gray.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        
        return result;
    }
    
    // Check if image is blurry
    function detectBlur(imageData) {
        if (!isOpenCVLoaded) return false;
        
        const src = cv.matFromImageData(imageData);
        const gray = new cv.Mat();
        
        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // Calculate Laplacian variance (measure of focus)
        const laplacian = new cv.Mat();
        cv.Laplacian(gray, laplacian, cv.CV_64F);
        
        // Calculate variance
        const mean = new cv.Mat();
        const stddev = new cv.Mat();
        cv.meanStdDev(laplacian, mean, stddev);
        
        // Get standard deviation value
        const stddevValue = stddev.doubleAt(0, 0);
        
        // Clean up
        src.delete();
        gray.delete();
        laplacian.delete();
        mean.delete();
        stddev.delete();
        
        // Lower values indicate more blur, threshold can be adjusted
        const blurThreshold = 15.0;
        return stddevValue < blurThreshold;
    }
    
    // Check if the detected card has colors typical of a Kenyan ID
    function checkKenyanIdColor(src, rect) {
        // Create a ROI (region of interest) from the detected rectangle
        const roi = src.roi(rect);
        
        // Convert to HSV for better color detection
        const hsv = new cv.Mat();
        cv.cvtColor(roi, hsv, cv.COLOR_RGB2HSV);
        
        // Define color range for typical Kenyan ID beige/tan color
        // H: 10-30 (orange/brown hue range)
        // S: 20-50% (mild saturation)
        // V: 70-90% (good brightness)
        const lower = new cv.Mat(1, 3, cv.CV_8UC1);
        const upper = new cv.Mat(1, 3, cv.CV_8UC1);
        
        lower.data[0] = 10;  // H lower
        lower.data[1] = 20;  // S lower
        lower.data[2] = 180; // V lower (scale 0-255)
        
        upper.data[0] = 30;  // H upper
        upper.data[1] = 120; // S upper
        upper.data[2] = 240; // V upper
        
        // Create mask of pixels in the color range
        const mask = new cv.Mat();
        cv.inRange(hsv, lower, upper, mask);
        
        // Count pixels in the color range
        const pixelsInRange = cv.countNonZero(mask);
        const totalPixels = rect.width * rect.height;
        const colorRatio = pixelsInRange / totalPixels;
        
        // Clean up
        roi.delete();
        hsv.delete();
        mask.delete();
        lower.delete();
        upper.delete();
        
        // Return true if enough pixels are in the Kenyan ID color range
        return colorRatio > 0.3; // At least 30% should match the color
    }
    
    // Return public methods
    return {
        initialize,
        processFrame,
        detectBlur,
        checkKenyanIdColor
    };
})();
