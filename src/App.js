import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import './App.css';

function App() {
  const [photo, setPhoto] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const compositeRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure you have granted camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL and set as photo
      const photoDataUrl = canvas.toDataURL('image/png');
      setPhoto(photoDataUrl);
      stopCamera();
    }
  };

  const downloadComposite = async () => {
    if (compositeRef.current) {
      try {
        const canvas = await html2canvas(compositeRef.current, {
          useCORS: true,
          backgroundColor: null
        });
        const link = document.createElement('a');
        link.download = 'composite-photo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Error generating composite:", err);
        alert("Error generating composite image. Please try again.");
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Photo Composition App</h1>
      </header>

      <main className="App-main">
        <div className="camera-section">
          {!photo && (
            <div className="camera-container">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="camera-feed"
                  />
                  <button onClick={capturePhoto} className="capture-button">
                    Capture Photo
                  </button>
                </>
              ) : (
                <button onClick={startCamera} className="start-camera-button">
                  Start Camera
                </button>
              )}
            </div>
          )}

          {photo && (
            <div className="composite-container" ref={compositeRef}>
              <div className="background-image">
                <img src="/background.jpg" alt="Background" />
              </div>
              <div className="photo-overlay">
                <img src={photo} alt="Captured" />
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {photo && (
          <div className="action-buttons">
            <button onClick={() => setPhoto(null)} className="reset-button">
              Take New Photo
            </button>
            <button onClick={downloadComposite} className="download-button">
              Download Composite
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 