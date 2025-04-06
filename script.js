document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const captureBtn = document.getElementById('capture-btn');
    const newPhotoBtn = document.getElementById('new-photo-btn');
    const downloadBtn = document.getElementById('download-btn');
    const printBtn = document.getElementById('print-btn');
    const resultSection = document.getElementById('result-section');
    const capturedPhoto = document.getElementById('captured-photo');

    let stream = null;

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
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        // Fill with a gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#4a4a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate video dimensions to maintain aspect ratio
        const scale = Math.min(
            canvas.width / video.videoWidth,
            canvas.height / video.videoHeight
        ) * 0.9; // Scale down to 90% to leave some margin

        const scaledWidth = video.videoWidth * scale;
        const scaledHeight = video.videoHeight * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;

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

    // Start camera when page loads
    startCamera();

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