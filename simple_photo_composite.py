import cv2
import numpy as np
import os

def capture_photo():
    """
    Capture photo from webcam.
    Returns the captured photo or None if cancelled.
    """
    # Initialize camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not access camera")
        return None
        
    print("\nCamera window opened!")
    print("Press SPACE to capture photo")
    print("Press ESC to cancel")
    
    while True:
        # Read frame from camera
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read from camera")
            break
            
        # Display the frame
        cv2.imshow('Take Photo - SPACE to capture, ESC to cancel', frame)
        
        # Check for key press
        key = cv2.waitKey(1) & 0xFF
        if key == 27:  # ESC key
            print("Cancelled by user")
            break
        elif key == 32:  # SPACE key
            print("Photo captured!")
            cap.release()
            cv2.destroyAllWindows()
            return frame
    
    # Release camera and close windows
    cap.release()
    cv2.destroyAllWindows()
    return None

def load_background(background_path):
    """
    Load the background image.
    """
    try:
        background = cv2.imread(background_path)
        if background is None:
            print("Error: Could not load background image")
            return None
        return background
    except Exception as e:
        print(f"Error loading background: {str(e)}")
        return None

def resize_photo(photo, background_height):
    """
    Resize photo to 1/3rd of background height while maintaining aspect ratio.
    """
    # Calculate target height (1/3rd of background height)
    target_height = int(background_height / 3)
    
    # Calculate width to maintain aspect ratio
    aspect_ratio = photo.shape[1] / photo.shape[0]
    target_width = int(target_height * aspect_ratio)
    
    # Resize the photo
    resized = cv2.resize(photo, (target_width, target_height))
    
    return resized

def place_on_background(photo, background):
    """
    Place the photo in the center of the background.
    """
    # Get dimensions
    ph, pw = photo.shape[:2]
    bh, bw = background.shape[:2]
    
    # Calculate center position
    x = (bw - pw) // 2
    y = (bh - ph) // 2
    
    # Create a copy of the background
    result = background.copy()
    
    # Place the photo
    result[y:y+ph, x:x+pw] = photo
    
    return result

def main():
    # Get current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define file paths
    background_path = os.path.join(current_dir, "background.jpg")
    output_path = os.path.join(current_dir, "result.png")
    
    # Check if background exists
    if not os.path.exists(background_path):
        print(f"Error: Background image not found at {background_path}")
        print("Please add your background image as 'background.jpg'")
        return
    
    # Capture photo from camera
    print("Opening camera...")
    photo = capture_photo()
    if photo is None:
        return
    
    # Load background
    background = load_background(background_path)
    if background is None:
        return
    
    # Resize photo
    resized_photo = resize_photo(photo, background.shape[0])
    
    # Create composite
    result = place_on_background(resized_photo, background)
    
    # Save result
    cv2.imwrite(output_path, result)
    print(f"Successfully created composite image: {output_path}")

if __name__ == "__main__":
    main() 