document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const captureBtn = document.getElementById('capture-btn');
    const newPhotoBtn = document.getElementById('new-photo-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resultSection = document.getElementById('result-section');
    const cameraContainer = document.getElementById('camera-container');
    const capturedPhoto = document.getElementById('captured-photo');

    let stream = null;
    let backgroundImage = new Image();
    backgroundImage.src = 'background.jpg';

    // Start camera
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            });
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                captureBtn.disabled = false;
            };
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please ensure you have granted camera permissions.");
        }
    }

    // Stop camera
    function stopCamera() {
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
            stream = null;
        }
    }

    // Capture and composite photo
    function capturePhoto() {
        const canvas = document.createElement('canvas');
        
        // Set canvas size to match background image dimensions
        canvas.width = backgroundImage.naturalWidth;
        canvas.height = backgroundImage.naturalHeight;
        const context = canvas.getContext('2d');

        // First draw background
        context.drawImage(backgroundImage, 0, 0);

        // Create temporary canvas for captured photo
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempContext = tempCanvas.getContext('2d');

        // Capture and flip webcam image
        tempContext.translate(tempCanvas.width, 0);
        tempContext.scale(-1, 1);
        tempContext.drawImage(video, 0, 0);

        // Calculate dimensions to fit photo in center third of background
        const targetWidth = canvas.width * 0.33; // One third of background width
        const scale = targetWidth / tempCanvas.width;
        const targetHeight = tempCanvas.height * scale;
        const x = (canvas.width - targetWidth) / 2;
        const y = (canvas.height - targetHeight) / 2;

        // Draw the captured photo onto main canvas
        context.drawImage(tempCanvas, x, y, targetWidth, targetHeight);
        
        // Add a subtle vignette effect
        const gradient = context.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Convert to data URL and set as photo
        capturedPhoto.src = canvas.toDataURL('image/png', 1.0);
        
        // Show result section
        resultSection.classList.remove('hidden');
        
        // Stop camera
        stopCamera();
    }

    // Take new photo
    function takeNewPhoto() {
        resultSection.classList.add('hidden');
        cameraContainer.classList.remove('hidden');
        startCamera();
    }

    // Download photo
    function downloadPhoto() {
        const link = document.createElement('a');
        link.download = `photo-composition-${new Date().toISOString().slice(0,19).replace(/[:]/g, '-')}.png`;
        link.href = capturedPhoto.src;
        link.click();
    }

    // Event listeners
    captureBtn.addEventListener('click', capturePhoto);
    newPhotoBtn.addEventListener('click', takeNewPhoto);
    downloadBtn.addEventListener('click', downloadPhoto);

    // Keyboard shortcuts
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && !captureBtn.disabled && !resultSection.classList.contains('hidden')) {
            capturePhoto();
        } else if (e.code === 'KeyR' && resultSection.classList.contains('hidden')) {
            takeNewPhoto();
        }
    });

    // Start camera when page loads
    startCamera();
}); 