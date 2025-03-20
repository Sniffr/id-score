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
        // In a real application, this would use computer vision to check if the ID card is within the guide
        // For this demo, we'll always return true
        return true;
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
