import cv2
import numpy as np
import os

def load_images(photo_path, background_path):
    """
    Load the user photo and background images.
    Returns the loaded images or None if loading fails.
    """
    try:
        # Read images
        photo = cv2.imread(photo_path)
        background = cv2.imread(background_path)
        
        if photo is None or background is None:
            print("Error: Could not load one or both images")
            return None, None
        
        # Enhance the photo brightness
        photo = enhance_brightness(photo)
            
        return photo, background
    except Exception as e:
        print(f"Error loading images: {str(e)}")
        return None, None

def enhance_brightness(image, alpha=1.3, beta=10):
    """
    Enhance the brightness and contrast of the image.
    Args:
        image: Input image
        alpha: Contrast control (1.0-3.0)
        beta: Brightness control (0-100)
    Returns:
        Enhanced image
    """
    # Convert to float32 for processing
    adjusted = image.astype(float)
    
    # Apply contrast and brightness adjustment
    adjusted = cv2.convertScaleAbs(adjusted, alpha=alpha, beta=beta)
    
    # Ensure the image is properly visible
    adjusted = cv2.normalize(adjusted, None, 0, 255, cv2.NORM_MINMAX)
    
    return adjusted

def resize_photo(photo, background_height, scale_factor=1/3):
    """
    Resize photo to specified fraction of background height while maintaining aspect ratio.
    Args:
        photo: Input photo to resize
        background_height: Height of the background image
        scale_factor: Fraction of background height to use (default: 1/3)
    Returns:
        Resized photo
    """
    # Calculate target height
    target_height = int(background_height * scale_factor)
    
    # Calculate scale factor to maintain aspect ratio
    scale = target_height / photo.shape[0]
    
    # Calculate new width
    target_width = int(photo.shape[1] * scale)
    
    # Resize photo using high-quality interpolation
    resized = cv2.resize(photo, (target_width, target_height), interpolation=cv2.INTER_LANCZOS4)
    
    return resized

def add_soft_border(photo, border_size=30, sigma=15):
    """
    Add a soft white border/shadow effect around the photo.
    Args:
        photo: Input photo
        border_size: Size of the border in pixels
        sigma: Gaussian blur sigma for soft edge
    Returns:
        Photo with soft border effect
    """
    # Create a larger canvas with white background
    h, w = photo.shape[:2]
    canvas = np.ones((h + 2*border_size, w + 2*border_size, 3), dtype=np.uint8) * 255
    
    # Place the photo in the center
    canvas[border_size:border_size+h, border_size:border_size+w] = photo
    
    # Create a mask for the photo
    mask = np.zeros((h + 2*border_size, w + 2*border_size), dtype=np.uint8)
    mask[border_size:border_size+h, border_size:border_size+w] = 255
    
    # Blur the mask to create soft edges
    soft_mask = cv2.GaussianBlur(mask, (0, 0), sigma)
    
    # Create 3-channel mask
    soft_mask_3channel = np.stack([soft_mask, soft_mask, soft_mask], axis=2) / 255.0
    
    # Blend the photo with white border (increased opacity of photo)
    result = (canvas * (1 - soft_mask_3channel) * 0.5 + canvas * soft_mask_3channel).astype(np.uint8)
    
    return result

def create_composite(photo, background):
    """
    Create composite image by centering photo on background.
    Args:
        photo: Photo with soft border
        background: Background image
    Returns:
        Composite image
    """
    # Get dimensions
    ph, pw = photo.shape[:2]
    bh, bw = background.shape[:2]
    
    # Calculate center position (ensure integer division)
    x = int((bw - pw) / 2)
    y = int((bh - ph) / 2)
    
    # Create copy of background
    result = background.copy()
    
    # Ensure coordinates are within bounds
    if x >= 0 and y >= 0 and x + pw <= bw and y + ph <= bh:
        # Place photo on background with alpha blending
        alpha = 0.95  # Photo opacity
        roi = result[y:y+ph, x:x+pw]
        result[y:y+ph, x:x+pw] = cv2.addWeighted(photo, alpha, roi, 1-alpha, 0)
    else:
        print("Warning: Photo dimensions exceed background boundaries")
    
    return result

def process_images(photo_path, background_path, output_path):
    """
    Main function to process images and create composite.
    """
    # Load images
    photo, background = load_images(photo_path, background_path)
    if photo is None or background is None:
        return False
    
    # Resize photo to 1/3rd of background height
    resized_photo = resize_photo(photo, background.shape[0])
    
    # Add soft border effect
    bordered_photo = add_soft_border(resized_photo)
    
    # Create composite
    result = create_composite(bordered_photo, background)
    
    # Save result
    cv2.imwrite(output_path, result)
    return True

def main():
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define file paths
    photo_path = os.path.join(current_dir, "photo.jpg")
    background_path = os.path.join(current_dir, "background.jpg")
    output_path = os.path.join(current_dir, "result.png")
    
    # Check if input files exist
    if not os.path.exists(photo_path):
        print(f"Error: Photo not found at {photo_path}")
        print("Please add your photo as 'photo.jpg'")
        return
        
    if not os.path.exists(background_path):
        print(f"Error: Background image not found at {background_path}")
        print("Please add your background image as 'background.jpg'")
        return
    
    # Process images
    if process_images(photo_path, background_path, output_path):
        print(f"Successfully created composite image: {output_path}")
    else:
        print("Failed to process images")

if __name__ == "__main__":
    main() 