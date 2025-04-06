document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const captureBtn = document.getElementById('capture-btn');
    const newPhotoBtn = document.getElementById('new-photo-btn');
    const downloadBtn = document.getElementById('download-btn');
    const printBtn = document.getElementById('print-btn');
    const resultSection = document.getElementById('result-section');
    const capturedPhoto = document.getElementById('captured-photo');
    const backgroundImg = document.getElementById('background-preview');

    let stream = null;

    // Make sure background is loaded
    if (!backgroundImg.complete) {
        backgroundImg.onload = () => {
            console.log('Background image loaded successfully');
        };
        backgroundImg.onerror = () => {
            console.error('Error loading background image');
            alert('Could not load background.jpg. Please make sure it exists in the same directory.');
        };
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
            video.play();
            captureBtn.disabled = false;
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please ensure you have granted camera permissions.");
        }
    }

    // Stop camera
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            stream = null;
        }
    }

    // Capture photo
    function capturePhoto() {
        // Create a fixed size canvas (16:9 aspect ratio, common resolution)
        const canvas = document.createElement('canvas');
        canvas.width = 1920;  // Fixed width
        canvas.height = 1080; // Fixed height
        const ctx = canvas.getContext('2d');

        // Fill with background first
        const bgScale = Math.max(canvas.width / backgroundImg.width, canvas.height / backgroundImg.height);
        const bgX = (canvas.width - backgroundImg.width * bgScale) / 2;
        const bgY = (canvas.height - backgroundImg.height * bgScale) / 2;
        ctx.drawImage(backgroundImg, bgX, bgY, backgroundImg.width * bgScale, backgroundImg.height * bgScale);

        // Calculate scaling for video to fit in canvas (make it smaller - 60% of the height)
        const targetHeight = canvas.height * 0.6; // Person takes up 60% of the height
        const scale = targetHeight / video.videoHeight;
        const scaledWidth = video.videoWidth * scale;
        const x = (canvas.width - scaledWidth) / 2; // Center horizontally
        const y = canvas.height - (targetHeight + 20); // Place near bottom with 20px margin

        // Draw video feed (mirrored)
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
            video,
            canvas.width - (x + scaledWidth), // Adjust x for mirroring
            y,
            scaledWidth,
            targetHeight
        );
        ctx.restore();

        // Add event hashtag
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.fillStyle = '#FF3366';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('#YourEventHashtag', canvas.width - 40, canvas.height - 40);

        // Set as captured photo
        capturedPhoto.src = canvas.toDataURL('image/png', 1.0);
        resultSection.classList.remove('hidden');
        stopCamera();
    }

    // Take new photo
    function takeNewPhoto() {
        resultSection.classList.add('hidden');
        startCamera();
    }

    // Download photo
    function downloadPhoto() {
        const link = document.createElement('a');
        link.download = `event-photo-${new Date().toISOString().slice(0,19).replace(/[:]/g, '-')}.png`;
        link.href = capturedPhoto.src;
        link.click();
    }

    // Print photo
    function printPhoto() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Event Photo</title>
                    <style>
                        body {
                            margin: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            background: #000;
                        }
                        img {
                            max-width: 100%;
                            max-height: 100vh;
                            object-fit: contain;
                        }
                        @media print {
                            body {
                                background: none;
                            }
                            img {
                                max-width: 100%;
                                height: auto;
                            }
                        }
                    </style>
                </head>
                <body>
                    <img src="${capturedPhoto.src}" onload="window.print();window.close()">
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    // Event listeners
    captureBtn.addEventListener('click', capturePhoto);
    newPhotoBtn.addEventListener('click', takeNewPhoto);
    downloadBtn.addEventListener('click', downloadPhoto);
    printBtn.addEventListener('click', printPhoto);

    // Keyboard shortcuts
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && !captureBtn.disabled) {
            capturePhoto();
        } else if (e.code === 'KeyR' && resultSection.classList.contains('hidden')) {
            takeNewPhoto();
        }
    });

    // Start camera when page loads
    startCamera();
}); 