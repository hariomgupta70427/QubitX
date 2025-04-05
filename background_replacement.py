import cv2
import numpy as np
import os
import mediapipe as mp

def capture_photo():
    """Capture photo from webcam with better user feedback"""
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not access camera")
        return None

    print("\nCamera window opened!")
    print("Press SPACE to capture photo")
    print("Press ESC to cancel")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read from camera")
            break

        # Mirror preview and add guidance text
        frame = cv2.flip(frame, 1)
        cv2.putText(frame, "Center your face and press SPACE", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.imshow('Background Replacement', frame)

        key = cv2.waitKey(1)
        if key == 27:  # ESC
            print("Cancelled by user")
            break
        elif key == 32:  # SPACE
            # Capture one more frame to ensure latest image
            ret, frame = cap.read()
            if ret:
                frame = cv2.flip(frame, 1)
                print("Photo captured!")
                break

    cap.release()
    cv2.destroyAllWindows()
    return frame if ret else None

def load_background(background_path, target_size):
    """Load and preprocess background image"""
    background = cv2.imread(background_path)
    if background is None:
        print(f"Error loading background: {background_path}")
        return None

    # Resize with smart cropping
    h, w = target_size
    bg_h, bg_w = background.shape[:2]
   
    # Calculate scale and crop
    scale = max(w/bg_w, h/bg_h)
    new_size = (int(bg_w * scale), int(bg_h * scale))
    resized = cv2.resize(background, new_size, interpolation=cv2.INTER_AREA)
   
    # Center crop
    x = (new_size[0] - w) // 2
    y = (new_size[1] - h) // 2
    cropped = resized[y:y+h, x:x+w]
   
    # Add slight blur to reduce sharp edges
    return cv2.GaussianBlur(cropped, (5, 5), 0)

def create_segmentation_mask(image):
    """Create segmentation mask using MediaPipe Selfie Segmentation"""
    mp_selfie_segmentation = mp.solutions.selfie_segmentation
    with mp_selfie_segmentation.SelfieSegmentation(model_selection=1) as model:
        results = model.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
       
        # Create binary mask with threshold
        mask = (results.segmentation_mask > 0.8).astype(np.uint8) * 255
       
        # Morphological operations to clean mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
       
        # Smooth mask edges
        return cv2.GaussianBlur(mask, (7, 7), 0)

def blend_images(foreground, background, mask):
    """Blend images with smooth edges using the mask"""
    # Convert mask to float and normalize
    mask = mask.astype(np.float32) / 255.0
    mask = np.stack([mask]*3, axis=-1)

    # Blend images
    foreground = foreground.astype(np.float32)
    background = background.astype(np.float32)
    blended = foreground * mask + background * (1 - mask)
   
    return blended.astype(np.uint8)

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    background_path = os.path.join(current_dir, "background.jpg")
    output_path = os.path.join(current_dir, "result.png")

    if not os.path.exists(background_path):
        print(f"Missing background.jpg in {current_dir}")
        return

    print("Capturing photo...")
    foreground = capture_photo()
    if foreground is None:
        return

    print("Processing image...")
    background = load_background(background_path, foreground.shape[:2])
    if background is None:
        return

    print("Creating segmentation mask...")
    mask = create_segmentation_mask(foreground)

    print("Blending images...")
    result = blend_images(foreground, background, mask)

    cv2.imwrite(output_path, result)
    print(f"Saved result to {output_path}")

    # Show preview
    cv2.imshow('Result', result)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()