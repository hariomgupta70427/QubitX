document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video');
    const outputCanvas = document.getElementById('output-canvas');
    const captureBtn = document.getElementById('capture-btn');
    const newPhotoBtn = document.getElementById('new-photo-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resultSection = document.getElementById('result-section');
    const cameraContainer = document.getElementById('camera-container');
    const capturedPhoto = document.getElementById('captured-photo');

    let stream = null;
    let selfieSegmentation = null;
    let backgroundImage = new Image();
    backgroundImage.src = 'background.jpg';

    // Initialize MediaPipe Selfie Segmentation
    async function initializeSegmentation() {
        selfieSegmentation = new SelfieSegmentation({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        }});

        selfieSegmentation.setOptions({
            modelSelection: 1,
            selfieMode: true
        });

        selfieSegmentation.onResults(onSegmentationResults);

        await selfieSegmentation.initialize();
    }

    // Handle segmentation results
    function onSegmentationResults(results) {
        const ctx = outputCanvas.getContext('2d');
        outputCanvas.width = video.videoWidth;
        outputCanvas.height = video.videoHeight;

        // Draw the segmentation mask
        ctx.drawImage(results.segmentationMask, 0, 0, outputCanvas.width, outputCanvas.height);

        // Only keep the person (white parts of the mask)
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    }

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
                // Start processing each frame
                processFrames();
            };
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please ensure you have granted camera permissions.");
        }
    }

    // Process video frames
    async function processFrames() {
        if (!selfieSegmentation || !video.videoWidth) return;
        await selfieSegmentation.send({image: video});
        if (video.srcObject) {
            requestAnimationFrame(processFrames);
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
        canvas.width = backgroundImage.naturalWidth;
        canvas.height = backgroundImage.naturalHeight;
        const ctx = canvas.getContext('2d');

        // Draw background
        ctx.drawImage(backgroundImage, 0, 0);

        // Calculate dimensions to fit segmented person in center third of background
        const targetWidth = canvas.width * 0.33;
        const scale = targetWidth / outputCanvas.width;
        const targetHeight = outputCanvas.height * scale;
        const x = (canvas.width - targetWidth) / 2;
        const y = (canvas.height - targetHeight) / 2;

        // Draw the segmented person
        ctx.drawImage(outputCanvas, x, y, targetWidth, targetHeight);

        // Add vignette effect
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set result and show
        capturedPhoto.src = canvas.toDataURL('image/png', 1.0);
        resultSection.classList.remove('hidden');
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
        link.download = `quantum-photo-${new Date().toISOString().slice(0,19).replace(/[:]/g, '-')}.png`;
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

    // Initialize
    await initializeSegmentation();
    startCamera();
}); 