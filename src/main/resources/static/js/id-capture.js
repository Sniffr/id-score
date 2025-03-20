/**
 * ID Capture functionality for Kenyan ID Verification System
 * Provides enhanced ID card capture and processing
 */

// ID Capture utilities object
const IdCapture = {
    // Process captured ID image
    processIdImage: function(imageData, side) {
        return new Promise((resolve, reject) => {
            try {
                // Create processing overlay
                const processingOverlay = this.createProcessingOverlay();
                
                // Simulate processing delay (in a real app, this would be actual OCR/processing)
                setTimeout(() => {
                    // Remove processing overlay
                    if (processingOverlay && processingOverlay.parentNode) {
                        processingOverlay.parentNode.removeChild(processingOverlay);
                    }
                    
                    // Extract data based on side
                    const extractedData = this.extractDataFromId(imageData, side);
                    resolve(extractedData);
                }, 2000);
            } catch (error) {
                console.error("Error processing ID image:", error);
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
        text.textContent = 'Processing ID...';
        overlay.appendChild(text);
        
        // Add to preview container
        const previewContainer = document.querySelector('.preview-container');
        if (previewContainer) {
            previewContainer.appendChild(overlay);
        }
        
        return overlay;
    },
    
    // Extract data from ID image
    extractDataFromId: function(imageData, side) {
        // In a real application, this would use OCR to extract text from the ID
        // For this demo, we'll return simulated data
        
        if (side === 'front') {
            return {
                idNumber: '12345678',
                fullName: 'JOHN DOE SMITH',
                dateOfBirth: '01/01/1990',
                sex: 'MALE',
                dateOfIssue: '01/01/2020',
                nationality: 'KENYAN'
            };
        } else if (side === 'back') {
            return {
                district: 'NAIROBI',
                division: 'CENTRAL',
                location: 'CITY SQUARE',
                subLocation: 'CBD',
                pinCode: 'KE12345'
            };
        }
        
        return {};
    },
    
    // Display extracted data
    displayExtractedData: function(data, container) {
        if (!container || !data) return;
        
        // Create data extraction container
        const extractionContainer = document.createElement('div');
        extractionContainer.className = 'id-data-extraction';
        
        // Add heading
        const heading = document.createElement('h5');
        heading.className = 'mb-3';
        heading.textContent = 'Extracted Information';
        extractionContainer.appendChild(heading);
        
        // Add fields
        for (const [key, value] of Object.entries(data)) {
            const field = document.createElement('div');
            field.className = 'extraction-field';
            
            const label = document.createElement('div');
            label.className = 'extraction-label';
            label.textContent = this.formatLabel(key) + ':';
            
            const valueElement = document.createElement('div');
            valueElement.className = 'extraction-value';
            valueElement.textContent = value;
            
            field.appendChild(label);
            field.appendChild(valueElement);
            extractionContainer.appendChild(field);
        }
        
        // Add to container
        container.appendChild(extractionContainer);
        
        return extractionContainer;
    },
    
    // Format label from camelCase to Title Case
    formatLabel: function(label) {
        // Convert camelCase to space-separated
        const spaceSeparated = label.replace(/([A-Z])/g, ' $1').trim();
        // Convert to Title Case
        return spaceSeparated.charAt(0).toUpperCase() + spaceSeparated.slice(1);
    },
    
    // Validate ID card
    validateIdCard: function(frontData, backData) {
        // In a real application, this would validate the ID card data
        // For this demo, we'll always return true
        return true;
    },
    
    // Enhance ID image quality
    enhanceImage: function(imageData) {
        // In a real application, this would enhance the image quality
        // For this demo, we'll just return the original image
        return imageData;
    },
    
    // Check if ID card is within guide
    isIdCardInGuide: function(videoElement, guideElement) {
        if (!videoElement || !guideElement) return false;
        
        // Get video dimensions
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        
        // Create canvas for image processing
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(videoElement, 0, 0, videoWidth, videoHeight);
        
        // Get image data for processing
        const imageData = context.getImageData(0, 0, videoWidth, videoHeight);
        
        // Check if there's a rectangle shape in the guide area
        const isRectangleDetected = this.detectRectangle(imageData, guideElement, videoElement);
        
        // Check if image has good contrast
        const hasGoodContrast = this.checkImageContrast(imageData);
        
        // Overall validation result
        const isValid = isRectangleDetected && hasGoodContrast;
        
        // Update guide appearance based on validation
        this.updateIdCardGuideStatus(guideElement, isValid);
        
        return isValid;
    },
    
    // Detect rectangle shape (ID card) within guide area
    detectRectangle: function(imageData, guideElement, videoElement) {
        // In a real application, this would use computer vision to detect edges
        // For this demo, we'll use a simplified approach to detect contrast changes
        
        // Get guide position relative to video
        const videoRect = videoElement.getBoundingClientRect();
        const guideRect = guideElement.getBoundingClientRect();
        
        // Calculate guide position in image coordinates
        const scaleX = videoElement.videoWidth / videoRect.width;
        const scaleY = videoElement.videoHeight / videoRect.height;
        
        const guideLeft = (guideRect.left - videoRect.left) * scaleX;
        const guideTop = (guideRect.top - videoRect.top) * scaleY;
        const guideWidth = guideRect.width * scaleX;
        const guideHeight = guideRect.height * scaleY;
        
        // Sample points around guide perimeter to detect edges
        const edgeDetected = this.sampleEdgePoints(imageData, 
            guideLeft, guideTop, guideWidth, guideHeight, 
            videoElement.videoWidth);
        
        return edgeDetected;
    },
    
    // Sample points around perimeter to detect edges
    sampleEdgePoints: function(imageData, left, top, width, height, stride) {
        // Number of sample points per edge
        const sampleCount = 10;
        let edgePointsDetected = 0;
        
        // Sample top edge
        for (let i = 0; i < sampleCount; i++) {
            const x = left + (width * i / sampleCount);
            const y = top;
            if (this.isEdgePoint(imageData, Math.floor(x), Math.floor(y), stride)) {
                edgePointsDetected++;
            }
        }
        
        // Sample right edge
        for (let i = 0; i < sampleCount; i++) {
            const x = left + width;
            const y = top + (height * i / sampleCount);
            if (this.isEdgePoint(imageData, Math.floor(x), Math.floor(y), stride)) {
                edgePointsDetected++;
            }
        }
        
        // Sample bottom edge
        for (let i = 0; i < sampleCount; i++) {
            const x = left + (width * i / sampleCount);
            const y = top + height;
            if (this.isEdgePoint(imageData, Math.floor(x), Math.floor(y), stride)) {
                edgePointsDetected++;
            }
        }
        
        // Sample left edge
        for (let i = 0; i < sampleCount; i++) {
            const x = left;
            const y = top + (height * i / sampleCount);
            if (this.isEdgePoint(imageData, Math.floor(x), Math.floor(y), stride)) {
                edgePointsDetected++;
            }
        }
        
        // If we detect enough edge points, consider it a rectangle
        return edgePointsDetected > (sampleCount * 4 * 0.3); // At least 30% of points should be edges
    },
    
    // Check if a point is an edge point by looking at local contrast
    isEdgePoint: function(imageData, x, y, stride) {
        // Get pixel data
        const idx = (y * stride + x) * 4;
        if (idx < 0 || idx >= imageData.data.length - 4) return false;
        
        // Get current pixel RGB
        const r1 = imageData.data[idx];
        const g1 = imageData.data[idx + 1];
        const b1 = imageData.data[idx + 2];
        
        // Get adjacent pixel RGB (right neighbor)
        const r2 = imageData.data[idx + 4];
        const g2 = imageData.data[idx + 5];
        const b2 = imageData.data[idx + 6];
        
        // Calculate contrast
        const contrast = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        
        // Consider it an edge if contrast is high enough
        return contrast > 100;
    },
    
    // Check image contrast
    checkImageContrast: function(imageData) {
        // Calculate average brightness
        let totalBrightness = 0;
        let pixelCount = 0;
        
        // Sample every 10th pixel for performance
        for (let i = 0; i < imageData.data.length; i += 40) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            
            // Calculate brightness (simple average)
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
            pixelCount++;
        }
        
        // Average brightness
        const avgBrightness = totalBrightness / pixelCount;
        
        // Check if brightness is in a good range (not too dark, not too bright)
        return avgBrightness > 50 && avgBrightness < 200;
    },
    
    // Update guide appearance based on validation
    updateIdCardGuideStatus: function(guideElement, result) {
        if (!guideElement) return;
        
        const isValid = result.isValid || false;
        
        // Update guide border color
        guideElement.style.border = isValid ? '2px solid #28a745' : '2px dashed #dc3545';
        guideElement.style.boxShadow = isValid 
            ? '0 0 0 2000px rgba(0, 0, 0, 0.3), 0 0 10px rgba(40, 167, 69, 0.8)' 
            : '0 0 0 2000px rgba(0, 0, 0, 0.3)';
        
        // Update guide text if it exists
        const guideText = guideElement.querySelector('div:not(.validation-status)');
        if (guideText) {
            guideText.textContent = result.message || (isValid ? 'ID card positioned correctly' : 'Position ID card within the frame');
            guideText.style.color = isValid ? '#28a745' : '#fff';
        }
        
        // Update validation status indicator if it exists
        const statusIndicator = guideElement.querySelector('.validation-status');
        if (statusIndicator) {
            statusIndicator.style.display = 'block';
            statusIndicator.textContent = result.message || (isValid ? 'Valid ID Position' : 'Adjust ID Position');
            statusIndicator.style.backgroundColor = isValid ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)';
        }
    },
    
    // Real-time ID card validation
    validateIdCardRealTime: function(videoElement, canvasElement, guideElement) {
        if (!videoElement || !canvasElement || !guideElement) return false;
        
        // Initialize IdCardDetection if needed
        if (typeof IdCardDetection !== 'undefined' && !IdCardDetection.cvLoaded) {
            IdCardDetection.initialize().catch(error => {
                console.error('Error initializing OpenCV:', error);
            });
        }
        
        // Use IdCardDetection if available, otherwise fallback to existing method
        if (typeof IdCardDetection !== 'undefined' && IdCardDetection.cvLoaded) {
            const result = IdCardDetection.detectIdCard(videoElement, canvasElement, guideElement);
            
            // Update guide appearance based on detection result
            this.updateIdCardGuideStatus(guideElement, result);
            
            // Visualize the detected ID card position
            this.visualizeIdCardPosition(videoElement, result);
            
            return result.isValid || false;
        } else {
            // Fallback to existing method
            const isValid = this.isIdCardInGuide(videoElement, guideElement);
            this.updateIdCardGuideStatus(guideElement, { isValid: isValid });
            return isValid;
        }
    },
    
    // Visualize the detected ID card position
    visualizeIdCardPosition: function(videoElement, result) {
        // Remove any existing outline
        const existingOutline = document.querySelector('.id-position-outline');
        if (existingOutline) {
            existingOutline.remove();
        }
        
        // If no card detected or video element not available, return
        if (!result.detected || !result.rect || !videoElement) {
            return;
        }
        
        // Get video dimensions and container
        const videoRect = videoElement.getBoundingClientRect();
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        const container = videoElement.parentElement;
        
        // Calculate position in display coordinates
        const scaleX = videoRect.width / videoWidth;
        const scaleY = videoRect.height / videoHeight;
        
        const displayX = result.rect.x * scaleX;
        const displayY = result.rect.y * scaleY;
        const displayWidth = result.rect.width * scaleX;
        const displayHeight = result.rect.height * scaleY;
        
        // Create outline element
        const outline = document.createElement('div');
        outline.className = 'id-position-outline';
        outline.style.left = displayX + 'px';
        outline.style.top = displayY + 'px';
        outline.style.width = displayWidth + 'px';
        outline.style.height = displayHeight + 'px';
        outline.style.borderColor = result.isValid ? '#28a745' : '#dc3545';
        outline.style.display = 'block';
        
        // Add message if needed
        if (result.message && !result.isValid) {
            const message = document.createElement('div');
            message.className = 'id-position-message';
            message.textContent = result.message;
            message.style.backgroundColor = result.isValid ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)';
            outline.appendChild(message);
        }
        
        // Add to container
        container.appendChild(outline);
    }
};

// Initialize ID capture when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize ID front capture page
    if (document.getElementById('capture-btn') && document.querySelector('.preview-container')) {
        const captureBtn = document.getElementById('capture-btn');
        const confirmBtn = document.getElementById('confirm-btn');
        
        // Process ID after capture
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function(e) {
                const imageData = document.getElementById('capturedImageData').value;
                if (!imageData) return;
                
                // If we're on the front ID page
                if (window.location.href.includes('id-front')) {
                    // Process front ID image
                    IdCapture.processIdImage(imageData, 'front')
                        .then(data => {
                            // Store extracted data in session storage for later use
                            sessionStorage.setItem('frontIdData', JSON.stringify(data));
                        })
                        .catch(error => {
                            console.error("Error processing front ID:", error);
                        });
                }
                
                // If we're on the back ID page
                if (window.location.href.includes('id-back')) {
                    // Process back ID image
                    IdCapture.processIdImage(imageData, 'back')
                        .then(data => {
                            // Store extracted data in session storage for later use
                            sessionStorage.setItem('backIdData', JSON.stringify(data));
                            
                            // Validate ID card using front and back data
                            const frontData = JSON.parse(sessionStorage.getItem('frontIdData') || '{}');
                            const isValid = IdCapture.validateIdCard(frontData, data);
                            
                            // Store validation result
                            sessionStorage.setItem('idCardValid', isValid);
                        })
                        .catch(error => {
                            console.error("Error processing back ID:", error);
                        });
                }
            });
        }
    }
    
    // Display extracted data on complete page
    if (document.querySelector('.verification-complete')) {
        const frontData = JSON.parse(sessionStorage.getItem('frontIdData') || '{}');
        const backData = JSON.parse(sessionStorage.getItem('backIdData') || '{}');
        
        const dataContainer = document.querySelector('.extracted-data-container');
        if (dataContainer) {
            if (Object.keys(frontData).length > 0) {
                IdCapture.displayExtractedData(frontData, dataContainer);
            }
            
            if (Object.keys(backData).length > 0) {
                IdCapture.displayExtractedData(backData, dataContainer);
            }
        }
    }
});
