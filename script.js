document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const captureBtn = document.getElementById('capture-btn');
    const newPhotoBtn = document.getElementById('new-photo-btn');
    const downloadBtn = document.getElementById('download-btn');
    const printBtn = document.getElementById('print-btn');
    const resultSection = document.getElementById('result-section');
    const capturedPhoto = document.getElementById('captured-photo');

    let stream = null;
    let backgroundImg = new Image();
    backgroundImg.src = 'background.jpg';

    // Make sure background is loaded
    backgroundImg.onload = () => {
        console.log('Background image loaded successfully');
        startCamera(); // Start camera after background is loaded
    };
    backgroundImg.onerror = () => {
        console.error('Error loading background image');
        alert('Could not load background.jpg. Please make sure it exists in the same directory.');
    };

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
        const canvas = document.createElement('canvas');
        // Match canvas size to background image's aspect ratio
        const bgAspectRatio = backgroundImg.width / backgroundImg.height;
        canvas.width = 1920;
        canvas.height = Math.round(canvas.width / bgAspectRatio);
        const ctx = canvas.getContext('2d');

        // Draw background image at full size without cropping
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        // Define more precise dimensions for the center area - making it larger
        // Increased from previous values to make the captured image larger
        const centerAreaWidth = canvas.width * 0.9;  // 90% of width (increased from 80%)
        const centerAreaHeight = canvas.height * 0.6; // 60% of height (increased from 50%)
        
        // Adjust vertical position to better align with the white center area
        // Negative value moves it up from center
        const verticalOffset = -canvas.height * 0.08; // 8% up from center
        
        // Calculate position
        const centerX = (canvas.width - centerAreaWidth) / 2;
        const centerY = (canvas.height - centerAreaHeight) / 2 + verticalOffset;
        
        // Reduced margin to allow more space for the image
        const marginPercent = 0.01; // 1% margin (reduced from 2%)
        const innerWidth = centerAreaWidth * (1 - 2 * marginPercent);
        const innerHeight = centerAreaHeight * (1 - 2 * marginPercent);
        const innerX = centerX + (centerAreaWidth * marginPercent);
        const innerY = centerY + (centerAreaHeight * marginPercent);
        
        // Calculate scale to fit video within the inner area
        const scale = Math.min(
            innerWidth / video.videoWidth,
            innerHeight / video.videoHeight
        );

        const scaledWidth = video.videoWidth * scale;
        const scaledHeight = video.videoHeight * scale;
        
        // Center in the inner area
        const x = innerX + (innerWidth - scaledWidth) / 2;
        const y = innerY + (innerHeight - scaledHeight) / 2;

        // Draw video feed (mirrored)
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
            video,
            canvas.width - (x + scaledWidth),
            y,
            scaledWidth,
            scaledHeight
        );
        ctx.restore();

        // Add QubitX hashtag
        ctx.font = 'bold 48px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('#QubitX', canvas.width - 40, canvas.height - 40);

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
        link.download = `qubitx-photo-${new Date().toISOString().slice(0,19).replace(/[:]/g, '-')}.png`;
        link.href = capturedPhoto.src;
        link.click();
    }

    // Print photo
    function printPhoto() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QubitX Photo</title>
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

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Close menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}); 