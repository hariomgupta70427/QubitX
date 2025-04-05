import cv2
import numpy as np
import os

def load_images(foreground_path, background_path):
    """
    Load the foreground (green screen) and background images.
    Returns the loaded images or None if loading fails.
    """
    try:
        foreground = cv2.imread(foreground_path)
        background = cv2.imread(background_path)
        
        if foreground is None or background is None:
            print("Error: Could not load one or both images")
            return None, None
            
        return foreground, background
    except Exception as e:
        print(f"Error loading images: {str(e)}")
        return None, None

def remove_green_screen(image, green_sensitivity=40, saturation_threshold=50):
    """
    Remove green screen background using HSV color space.
    Args:
        image: Input image with green screen background
        green_sensitivity: How much variation in green to tolerate (default: 40)
        saturation_threshold: Minimum saturation to consider as green screen (default: 50)
    Returns:
        Tuple of (foreground image with alpha channel, binary mask)
    """
    # Convert to HSV color space
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Define green color range
    green_hue = 60  # Green is around 60 in HSV
    lower_green = np.array([green_hue - green_sensitivity, saturation_threshold, 50])
    upper_green = np.array([green_hue + green_sensitivity, 255, 255])
    
    # Create mask for green screen
    mask = cv2.inRange(hsv, lower_green, upper_green)
    
    # Invert mask to get the foreground
    mask = cv2.bitwise_not(mask)
    
    # Apply some morphological operations to clean up the mask
    kernel = np.ones((3,3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # Apply gaussian blur to smooth edges
    mask = cv2.GaussianBlur(mask, (5,5), 0)
    
    # Create alpha channel
    alpha = mask / 255.0
    
    # Convert to 4-channel (BGRA) image
    foreground_alpha = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
    foreground_alpha[:, :, 3] = alpha * 255
    
    return foreground_alpha, mask

def resize_to_fit(image, background_size, padding_percent=10):
    """
    Resize image to fit within background while maintaining aspect ratio.
    Args:
        image: Input image to resize
        background_size: Tuple of (height, width) of background
        padding_percent: Percentage of padding to leave around edges
    Returns:
        Resized image
    """
    bg_height, bg_width = background_size
    
    # Calculate target size with padding
    target_height = int(bg_height * (1 - padding_percent/100))
    target_width = int(bg_width * (1 - padding_percent/100))
    
    # Get current image size
    img_height, img_width = image.shape[:2]
    
    # Calculate scaling factors
    height_ratio = target_height / img_height
    width_ratio = target_width / img_width
    
    # Use smaller ratio to fit within bounds
    scale = min(height_ratio, width_ratio)
    
    # Calculate new size
    new_width = int(img_width * scale)
    new_height = int(img_height * scale)
    
    # Resize image
    resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
    
    return resized

def create_composite(foreground, background):
    """
    Create composite image by centering foreground on background.
    Args:
        foreground: BGRA image with alpha channel
        background: BGR background image
    Returns:
        Composite image
    """
    # Get dimensions
    fg_height, fg_width = foreground.shape[:2]
    bg_height, bg_width = background.shape[:2]
    
    # Calculate center position
    x = (bg_width - fg_width) // 2
    y = (bg_height - fg_height) // 2
    
    # Create copy of background
    result = background.copy()
    
    # Extract alpha channel and normalize
    alpha = foreground[:, :, 3] / 255.0
    
    # Stack alpha channel for multiplication
    alpha = np.stack([alpha, alpha, alpha], axis=2)
    
    # Extract RGB channels from foreground
    foreground_rgb = foreground[:, :, :3]
    
    # Extract region of interest from background
    roi = result[y:y+fg_height, x:x+fg_width]
    
    # Blend images
    blended = (1 - alpha) * roi + alpha * foreground_rgb
    
    # Place blended image back into result
    result[y:y+fg_height, x:x+fg_width] = blended
    
    return result

def process_images(foreground_path, background_path, output_path):
    """
    Main function to process images and create composite.
    """
    # Load images
    foreground, background = load_images(foreground_path, background_path)
    if foreground is None or background is None:
        return False
    
    # Remove green screen
    foreground_alpha, mask = remove_green_screen(foreground)
    
    # Resize foreground to fit background
    resized_foreground = resize_to_fit(foreground_alpha, background.shape[:2])
    
    # Create composite
    result = create_composite(resized_foreground, background)
    
    # Save result
    cv2.imwrite(output_path, result)
    return True

def main():
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define file paths
    foreground_path = os.path.join(current_dir, "green_screen.jpg")
    background_path = os.path.join(current_dir, "background.jpg")
    output_path = os.path.join(current_dir, "result.png")
    
    # Check if input files exist
    if not os.path.exists(foreground_path):
        print(f"Error: Green screen image not found at {foreground_path}")
        print("Please add your green screen image as 'green_screen.jpg'")
        return
        
    if not os.path.exists(background_path):
        print(f"Error: Background image not found at {background_path}")
        print("Please add your background image as 'background.jpg'")
        return
    
    # Process images
    if process_images(foreground_path, background_path, output_path):
        print(f"Successfully created composite image: {output_path}")
    else:
        print("Failed to process images")

if __name__ == "__main__":
    main() 