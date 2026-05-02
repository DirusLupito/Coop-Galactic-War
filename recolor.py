# Used to generate the coop alert images for the open to coop prompt. 
# The original images are bground_alert_special_rest.png, bground_alert_special_hover.png, and bground_alert_special_active.png.

from pathlib import Path

import numpy as np
from PIL import Image


FILES = [
    "bground_alert_active.png",
    "bground_alert_hover.png",
    "bground_alert_rest.png",
]


def make_coop_version(path: Path) -> Path:
    image = Image.open(path).convert("RGBA")

    # Tensor shape is (height, width, 4), with channels ordered as R, G, B, A.
    tensor = np.array(image, dtype=np.float32)
    # tensor[..., :3] //= 4
    
    # # Now we add 100 to the blue channel make it blue
    # tensor[..., 2] += 100
    
    # Makes it too violet. New idea: we use a gradient map.
    # these magic numbers by WIKIPEDIA https://en.wikipedia.org/wiki/Relative_luminance
    # wtf????
    
    # Map each pixel vector R,G,B to a value of how bright it is to the human eye.
    luminance = np.dot(tensor[..., :3], [0.2126, 0.7152, 0.0722])
    
    # now we can just multiply the brightness by some random actually magic color numbers.
    # amount_red = 0.12
    # amount_green = 0.42
    # amount_blue = 1.25
    
    # new_tensor = np.zeros(tensor.shape, dtype=np.float32)
    # new_tensor[..., 0] = luminance * amount_red
    # new_tensor[..., 1] = luminance * amount_green
    # new_tensor[..., 2] = luminance * amount_blue
    # new_tensor[..., 3] = tensor[..., 3]
    
    # new_tensor = np.clip(new_tensor, 0, 255).astype(np.uint8)
    
    # still not satisfactory, will produce a very bright or sometimes deep blue.
    
    # New idea: color map.
    map_brightness_to_this_color = np.array([70, 85, 95])
    map_darkness_to_this_color = np.array([6, 8, 10])
    
    # interpolate between the two colors based on the luminance
    luminance_normalized = luminance / 255.0
    
    # y = mx + b
    new_tensor = np.zeros(tensor.shape, dtype=np.float32)
    # y                 =                         m                                           x                         +             b
    new_tensor[..., :3] = (map_brightness_to_this_color - map_darkness_to_this_color) * luminance_normalized[..., None] + map_darkness_to_this_color
    new_tensor[..., 3] = tensor[..., 3]
    
    # cast to uint8 so pil doesn't go schizo
    new_tensor = np.clip(new_tensor, 0, 255).astype(np.uint8)

    output_path = path.with_name(f"{path.stem}_coop{path.suffix}")
    Image.fromarray(new_tensor, mode="RGBA").save(output_path)
    return output_path


def main() -> None:
    for filename in FILES:
        output_path = make_coop_version(Path(filename))
        print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
