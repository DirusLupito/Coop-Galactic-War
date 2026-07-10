# Helper used to generate a set of color presets for factions in coop galactic war.
# Users may specify a number of colors to generate, along with a set of available colors to use,
# and a source faction color to use as the basis for selecting colors from the set of possible colors.

# This script will then generate an image showing how each of the icons will look when tinted with each 
# of the generated colors.

# Note that by specify, I mean manually editing this script :)

from pathlib import Path
import sys

import numpy as np
from PIL import Image

# I assume you place the source images in a subfolder called "srcimg" next to this script.
RELATIVE_ICON_PATH = Path(__file__).parent / "srcimg"

# List of available colors to use for generating faction colors.
AVAILABLE_COLORS = []

# I just wanted to copy the cpp code and not edit it too much
# so instead of properly defining my constants I just
# redefined the cpp fromBytes function here as a python function,
# and also made it add any colors sent here to the master color
# list as a lazy way to avoid having to manually add them to the list.
def fromBytes(r, g, b):
    """
    Clone of pa_dev/engine/zu/color.cpp's fromBytes(). That function constructs a
    Color4b with alpha defaulting to 0xff, then calls asColor4f_linear(), which is
    only byte normalization. It does not apply the sRGB transfer function.
    """
    AVAILABLE_COLORS.append((r, g, b))
    return np.array([r / 255.0, g / 255.0, b / 255.0], dtype=np.float32)

# set of possible colors lifted NOT from the multiplayer color list, but instead color.cpp
# since there are more colors there and I like more.
AliceBlue            = fromBytes(0xf0, 0xf8, 0xff);
AntiqueWhite         = fromBytes(0xfa, 0xeb, 0xd7);
Aqua                 = fromBytes(0x00, 0xff, 0xff);
Aquamarine           = fromBytes(0x7f, 0xff, 0xd4);
Azure                = fromBytes(0xf0, 0xff, 0xff);
Beige                = fromBytes(0xf5, 0xf5, 0xdc);
Bisque               = fromBytes(0xff, 0xe4, 0xc4);
Black                = fromBytes(0x00, 0x00, 0x00);
BlanchedAlmond       = fromBytes(0xff, 0xeb, 0xcd);
Blue                 = fromBytes(0x00, 0x00, 0xff);
BlueViolet           = fromBytes(0x8a, 0x2b, 0xe2);
Brown                = fromBytes(0xa5, 0x2a, 0x2a);
BurlyWood            = fromBytes(0xde, 0xb8, 0x87);
CadetBlue            = fromBytes(0x5f, 0x9e, 0xa0);
Chartreuse           = fromBytes(0x7f, 0xff, 0x00);
Chocolate            = fromBytes(0xd2, 0x69, 0x1e);
Coral                = fromBytes(0xff, 0x7f, 0x50);
CornflowerBlue       = fromBytes(0x64, 0x95, 0xed);
Cornsilk             = fromBytes(0xff, 0xf8, 0xdc);
Crimson              = fromBytes(0xdc, 0x14, 0x3c);
Cyan                 = fromBytes(0x00, 0xff, 0xff);
DarkBlue             = fromBytes(0x00, 0x00, 0x8b);
DarkCyan             = fromBytes(0x00, 0x8b, 0x8b);
DarkGoldenrod        = fromBytes(0xb8, 0x86, 0x0b);
DarkGray             = fromBytes(0xa9, 0xa9, 0xa9);
DarkGreen            = fromBytes(0x00, 0x64, 0x00);
DarkKhaki            = fromBytes(0xbd, 0xb7, 0x6b);
DarkMagenta          = fromBytes(0x8b, 0x00, 0x8b);
DarkOliveGreen       = fromBytes(0x55, 0x6b, 0x2f);
DarkOrange           = fromBytes(0xff, 0x8c, 0x00);
DarkOrchid           = fromBytes(0x99, 0x32, 0xcc);
DarkRed              = fromBytes(0x8b, 0x00, 0x00);
DarkSalmon           = fromBytes(0xe9, 0x96, 0x7a);
DarkSeaGreen         = fromBytes(0x8f, 0xbc, 0x8b);
DarkSlateBlue        = fromBytes(0x48, 0x3d, 0x8b);
DarkSlateGray        = fromBytes(0x2f, 0x4f, 0x4f);
DarkTurquoise        = fromBytes(0x00, 0xce, 0xd1);
DarkViolet           = fromBytes(0x94, 0x00, 0xd3);
DeepPink             = fromBytes(0xff, 0x14, 0x93);
DeepSkyBlue          = fromBytes(0x00, 0xbf, 0xff);
DimGray              = fromBytes(0x69, 0x69, 0x69);
DodgerBlue           = fromBytes(0x1e, 0x90, 0xff);
Firebrick            = fromBytes(0xb2, 0x22, 0x22);
FloralWhite          = fromBytes(0xff, 0xfa, 0xf0);
ForestGreen          = fromBytes(0x22, 0x8b, 0x22);
Fuchsia              = fromBytes(0xff, 0x00, 0xff);
Gainsboro            = fromBytes(0xdc, 0xdc, 0xdc);
GhostWhite           = fromBytes(0xf8, 0xf8, 0xff);
Gold                 = fromBytes(0xff, 0xd7, 0x00);
Goldenrod            = fromBytes(0xda, 0xa5, 0x20);
Gray                 = fromBytes(0x80, 0x80, 0x80);
Green                = fromBytes(0x00, 0x80, 0x00);
GreenYellow          = fromBytes(0xad, 0xff, 0x2f);
Honeydew             = fromBytes(0xf0, 0xff, 0xf0);
HotPink              = fromBytes(0xff, 0x69, 0xb4);
IndianRed            = fromBytes(0xcd, 0x5c, 0x5c);
Indigo               = fromBytes(0x4b, 0x00, 0x82);
Ivory                = fromBytes(0xff, 0xff, 0xf0);
Khaki                = fromBytes(0xf0, 0xe6, 0x8c);
Lavender             = fromBytes(0xe6, 0xe6, 0xfa);
LavenderBlush        = fromBytes(0xff, 0xf0, 0xf5);
LawnGreen            = fromBytes(0x7c, 0xfc, 0x00);
LemonChiffon         = fromBytes(0xff, 0xfa, 0xcd);
LightBlue            = fromBytes(0xad, 0xd8, 0xe6);
LightCoral           = fromBytes(0xf0, 0x80, 0x80);
LightCyan            = fromBytes(0xe0, 0xff, 0xff);
LightGoldenrodYellow = fromBytes(0xfa, 0xfa, 0xd2);
LightGreen           = fromBytes(0x90, 0xee, 0x90);
LightGray            = fromBytes(0xd3, 0xd3, 0xd3);
LightPink            = fromBytes(0xff, 0xb6, 0xc1);
LightSalmon          = fromBytes(0xff, 0xa0, 0x7a);
LightSeaGreen        = fromBytes(0x20, 0xb2, 0xaa);
LightSkyBlue         = fromBytes(0x87, 0xce, 0xfa);
LightSlateGray       = fromBytes(0x77, 0x88, 0x99);
LightSteelBlue       = fromBytes(0xb0, 0xc4, 0xde);
LightYellow          = fromBytes(0xff, 0xff, 0xe0);
Lime                 = fromBytes(0x00, 0xff, 0x00);
LimeGreen            = fromBytes(0x32, 0xcd, 0x32);
Linen                = fromBytes(0xfa, 0xf0, 0xe6);
Magenta              = fromBytes(0xff, 0x00, 0xff);
Maroon               = fromBytes(0x80, 0x00, 0x00);
MediumAquamarine     = fromBytes(0x66, 0xcd, 0xaa);
MediumBlue           = fromBytes(0x00, 0x00, 0xcd);
MediumOrchid         = fromBytes(0xba, 0x55, 0xd3);
MediumPurple         = fromBytes(0x93, 0x70, 0xdb);
MediumSeaGreen       = fromBytes(0x3c, 0xb3, 0x71);
MediumSlateBlue      = fromBytes(0x7b, 0x68, 0xee);
MediumSpringGreen    = fromBytes(0x00, 0xfa, 0x9a);
MediumTurquoise      = fromBytes(0x48, 0xd1, 0xcc);
MediumVioletRed      = fromBytes(0xc7, 0x15, 0x85);
MidnightBlue         = fromBytes(0x19, 0x19, 0x70);
MintCream            = fromBytes(0xf5, 0xff, 0xfa);
MistyRose            = fromBytes(0xff, 0xe4, 0xe1);
Moccasin             = fromBytes(0xff, 0xe4, 0xb5);
NavajoWhite          = fromBytes(0xff, 0xde, 0xad);
Navy                 = fromBytes(0x00, 0x00, 0x80);
OldLace              = fromBytes(0xfd, 0xf5, 0xe6);
Olive                = fromBytes(0x80, 0x80, 0x00);
OliveDrab            = fromBytes(0x6b, 0x8e, 0x23);
# Some dumbass shit all over the color.cpp code 
# with this one. Why isn't this hex??? >:(
Orange               = fromBytes(0xff,  106, 0x00);
OrangeRed            = fromBytes(0xff, 0x45, 0x00);
Orchid               = fromBytes(0xda, 0x70, 0xd6);
PaleGoldenrod        = fromBytes(0xee, 0xe8, 0xaa);
PaleGreen            = fromBytes(0x98, 0xfb, 0x98);
PaleTurquoise        = fromBytes(0xaf, 0xee, 0xee);
PaleVioletRed        = fromBytes(0xdb, 0x70, 0x93);
PapayaWhip           = fromBytes(0xff, 0xef, 0xd5);
PeachPuff            = fromBytes(0xff, 0xda, 0xb9);
Peru                 = fromBytes(0xcd, 0x85, 0x3f);
Pink                 = fromBytes(0xff, 0xc0, 0xcb);
Plum                 = fromBytes(0xdd, 0xa0, 0xdd);
PowderBlue           = fromBytes(0xb0, 0xe0, 0xe6);
Purple               = fromBytes(0x80, 0x00, 0x80);
Red                  = fromBytes(0xff, 0x00, 0x00);
RosyBrown            = fromBytes(0xbc, 0x8f, 0x8f);
RoyalBlue            = fromBytes(0x41, 0x69, 0xe1);
SaddleBrown          = fromBytes(0x8b, 0x45, 0x13);
Salmon               = fromBytes(0xfa, 0x80, 0x72);
SandyBrown           = fromBytes(0xf4, 0xa4, 0x60);
SeaGreen             = fromBytes(0x2e, 0x8b, 0x57);
SeaShell             = fromBytes(0xff, 0xf5, 0xee);
Sienna               = fromBytes(0xa0, 0x52, 0x2d);
Silver               = fromBytes(0xc0, 0xc0, 0xc0);
SkyBlue              = fromBytes(0x87, 0xce, 0xeb);
SlateBlue            = fromBytes(0x6a, 0x5a, 0xcd);
SlateGray            = fromBytes(0x70, 0x80, 0x90);
Snow                 = fromBytes(0xff, 0xfa, 0xfa);
SpringGreen          = fromBytes(0x00, 0xff, 0x7f);
SteelBlue            = fromBytes(0x46, 0x82, 0xb4);
Tan                  = fromBytes(0xd2, 0xb4, 0x8c);
Teal                 = fromBytes(0x00, 0x80, 0x80);
Thistle              = fromBytes(0xd8, 0xbf, 0xd8);
Tomato               = fromBytes(0xff, 0x63, 0x47);
Turquoise            = fromBytes(0x40, 0xe0, 0xd0);
Violet               = fromBytes(0xee, 0x82, 0xee);
Wheat                = fromBytes(0xf5, 0xde, 0xb3);
White                = fromBytes(0xff, 0xff, 0xff);
WhiteSmoke           = fromBytes(0xf5, 0xf5, 0xf5);
Yellow               = fromBytes(0xff, 0xff, 0x00);
YellowGreen          = fromBytes(0x9a, 0xcd, 0x32);

def _color_to_byte_rgb(color):
    color = list(color[:3])
    if max(color) <= 1.0:
        return tuple(int(round(channel * 255)) for channel in color)
    return tuple(int(channel) for channel in color)


def _colors_equal(a, b):
    return a[0] == b[0] and a[1] == b[1] and a[2] == b[2]


# Clone of the co-op referee nearest-color algorithm in gw_coop_referee.js.
# It ranks candidate colors by squared RGB distance from the source color. The
# sqrt is intentionally skipped because it would preserve the same ordering.
def _color_distance_squared(a, b):
    red = a[0] - b[0]
    green = a[1] - b[1]
    blue = a[2] - b[2]
    return (red * red) + (green * green) + (blue * blue)


# copy of the color picker algorithm used in coop galactic war
def nearest_referee_colors(source_color, n, stride, colors):
    """
    Find the nearest colors to a source color based on RGB distance.

    Args:
        source_color: The color to find nearest colors to. Can be a hex string,
            0-255 RGB, or 0-1 RGB.
        n: The number of colors to return.
        stride: The number of nearest colors to skip before returning results.
        colors: A list of colors to search. Each color can be a hex string,
            0-255 RGB, or 0-1 RGB.

    Returns:
        A list of the nearest colors to the source color, sorted by distance.
    """
    source_color = _color_to_byte_rgb(source_color)
    candidates = []

    for color in colors:
        color = _color_to_byte_rgb(color)
        if _colors_equal(color, source_color):
            continue

        if any(_colors_equal(color, candidate["color"]) for candidate in candidates):
            continue

        candidates.append({
            "color": color,
            "distance": _color_distance_squared(color, source_color),
        })

    candidates.sort(key=lambda candidate: candidate["distance"])
    return [candidate["color"] for candidate in candidates[stride:stride + n]]


# helper when loading colors from a file that converts strings of the format
#   (255, 140, 0)
# for instance to the format #rrggbb
def _parse_color_string(color_string):
    color_string = color_string.strip()
    if color_string.startswith("(") and color_string.endswith(")"):
        color_string = color_string[1:-1]
        parts = color_string.split(",")
        if len(parts) != 3:
            raise ValueError(f"Invalid color string: {color_string}")
        r, g, b = (int(part.strip()) for part in parts)
        return f"#{r:02x}{g:02x}{b:02x}"
    return color_string


def _load_colors_from_file(color_file):
    with open(color_file, "r", encoding="utf-8") as handle:
        return [_parse_color_string(line.strip()) for line in handle if line.strip()]


# PNG pixels, CSS hex colors, and the PA lobby color table are sRGB colors.
# sRGB is nonlinear: a value of 0.5 does not mean "half as much light".
# The PA client converts army colors to linear RGB with this standard sRGB
# transfer function before passing them to particle_icon.fs as v_ColorPrimary.
def _srgb_channel_to_linear(value):
    value = value / 255.0 if value > 1.0 else value
    if value <= 0.04045:
        return value / 12.92
    return ((value + 0.055) / 1.055) ** 2.4


# The shader math produces linear RGB. Convert it back to standard sRGB before
# saving a PNG preview, otherwise normal image viewers will display it too dark.
def _linear_to_srgb(color):
    return np.where(color <= 0.0031308, color * 12.92, (1.055 * np.power(color, 1.0 / 2.4)) - 0.055)

# Convert a color from sRGB to linear RGB. Accepts a hex string, 0-255 RGB, or 0-1 RGB.
# Will return a 0-1 RGB numpy array of floats.
def _srgb_color_to_linear(color):
    if isinstance(color, str):
        color = color.lstrip("#")
        color = (
            int(color[0:2], 16),
            int(color[2:4], 16),
            int(color[4:6], 16),
        )

    # We have a helper function for a single channel, so just call it for each channel in the color.
    return np.array([_srgb_channel_to_linear(float(channel)) for channel in color[:3]], dtype=np.float32)


def color_strategic_icon(icon_png, color, selected=False, hovered=False, alpha=1.0, encode_srgb=True):
    """Render a strategic icon PNG with PA's in-game strategic icon tint shader.
    Relevant file pa_dev/engine/shaders/gl/particle_icon.fs is copied here for reference.

    ```glsl
    #version 140

    // particle_icon.fs

    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform sampler2D Texture;

    in vec2 v_TexCoord;
    in vec4 v_ColorPrimary;
    in vec4 v_ColorSecondary;
    in float v_SelectedState;

    out vec4 out_FragColor;

    void main()
    {
        vec4 texel = texture(Texture, v_TexCoord).bgra; // webkit texture is bgra
        if (v_ColorPrimary.w == 0.0)
            out_FragColor = texel;
        else
        {
            // horrible, horrible hack to work aground webkit png handling
            texel.rgb = clamp((texel.rgb - 0.27) / 0.7, 0.0, 1.0);

            vec3 mixColor = v_SelectedState > 0.0 ? vec3(1.0, 1.0, 1.0) : vec3(0.0, 0.0, 0.0);
            vec3 color = texel.r * mix(mixColor, v_ColorPrimary.rgb, pow(texel.g, 1.0 / 2.2) / (texel.a + 0.00001));

            float alpha = texel.a;

            // check for hover
            if (abs(v_SelectedState) > 1.5)
            {
                float mask = pow(texel.r, 1.0 / 2.2);
                alpha = mix(min(1.0, 2.0 * alpha), alpha, mask);
                color = mix(vec3(1.0, 1.0, 1.0), color, mask);
            }

            out_FragColor = vec4(color, alpha * v_ColorPrimary.a);
        }
    }
    ```


    Args:
        icon_png: Path or file-like object for a strategic icon PNG.
        color: Primary player color as '#rrggbb', 0-255 RGB, or 0-1 RGB.
        selected: Use the selected-icon white mix color instead of the normal black mix.
        hovered: Apply the extra hover whitening/alpha boost.
        alpha: Extra multiplier applied like the engine's primary color alpha.
        encode_srgb: Convert the rendered linear RGB back to sRGB for normal PNG viewing.

    Returns:
        A PIL RGBA image. Save it as PNG with `image.save(path)`.
    """
    icon = Image.open(icon_png).convert("RGBA")
    texel = np.asarray(icon, dtype=np.float32) / 255.0

    texel[..., :3] = np.clip((texel[..., :3] - 0.27) / 0.7, 0.0, 1.0)

    red = texel[..., 0:1]
    green = texel[..., 1:2]
    texel_alpha = texel[..., 3:4]

    primary = _srgb_color_to_linear(color)
    mix_color = np.ones(3, dtype=np.float32) if selected else np.zeros(3, dtype=np.float32)
    blend = np.power(green, 1.0 / 2.2) / (texel_alpha + 0.00001)
    rendered_rgb = red * (mix_color + (primary - mix_color) * blend)
    rendered_alpha = texel_alpha * alpha

    if hovered:
        mask = np.power(red, 1.0 / 2.2)
        rendered_alpha = (np.minimum(1.0, 2.0 * rendered_alpha) * (1.0 - mask)) + (rendered_alpha * mask)
        rendered_rgb = (np.ones(3, dtype=np.float32) * (1.0 - mask)) + (rendered_rgb * mask)

    if encode_srgb:
        rendered_rgb = _linear_to_srgb(rendered_rgb)

    rendered = np.dstack((rendered_rgb, rendered_alpha))
    rendered = np.clip(rendered * 255.0, 0.0, 255.0).astype(np.uint8)
    return Image.fromarray(rendered, "RGBA")




def main() -> None:
    # figure out how many images we're dealing with
    icon_folder = RELATIVE_ICON_PATH
    icon_files = [f for f in icon_folder.iterdir() if f.is_file() and f.suffix == ".png"]

    print(f"Found {len(icon_files)} icon files in {icon_folder}")
    print(f"Using {len(AVAILABLE_COLORS)} available colors for generating faction colors")
    color_file = sys.argv[1] if len(sys.argv) > 1 else None
    if color_file:
        nearest_colors = _load_colors_from_file(color_file)
        print(f"Using {len(nearest_colors)} colors from {color_file}")
    else:
        numcolors = int(input("How many colors do you want to preview? "))
        source_color = input("Enter a source color to base the generated colors on (example '#ff0000' or '255,0,0'): ")

        # have to convert the source color to a tuple of floats in the range 0-1, since the nearest_referee_colors function expects that.
        if source_color.startswith("#"):
            source_color = tuple(int(source_color[i:i+2], 16) / 255.0 for i in (1, 3, 5))
        else:
            source_color = tuple(int(x) / 255.0 for x in source_color.split(","))


        stride = int(input("Enter a stride value (number of nearest colors to skip): "))
        nearest_colors = nearest_referee_colors(source_color, numcolors, stride, AVAILABLE_COLORS)
        print(f"Generated {len(nearest_colors)} colors based on source color {source_color} with stride {stride}")

    print("Colors:")
    for color in nearest_colors:
        print(f"{color}")

    save_path = input("Enter a path to save the generated image (example 'color_preset_preview.png'): ")

    # we want to make a grid of images, each image itself a square or as close to square as possible
    # shape of sub-sub-images which themselves are the colored icons.
    # Each sub-image (so collection of icons) will be a square containing all the icons colored in one of the generated colors.
    # The overall image will be a grid of these sub-images.

    # First lets figure out how big the biggest icon is, so we can make all the sub-images the same size.
    max_icon_width = 0
    max_icon_height = 0
    for icon_file in icon_files:
        with Image.open(icon_file) as icon:
            max_icon_width = max(max_icon_width, icon.width)
            max_icon_height = max(max_icon_height, icon.height)

    # Next, we figure out the exact dimensions of the sub-images
    # (just take the square root, then floor it, then we will have
    # one extra row or column of icons if the number of icons is not a perfect square)
    # how about an extra row
    icons_per_row = int(np.ceil(np.sqrt(len(icon_files))))
    icons_per_col = int(np.ceil(len(icon_files) / icons_per_row))
    sub_image_width = icons_per_row * max_icon_width
    sub_image_height = icons_per_col * max_icon_height

    # Same idea for the overall image, but now we are dealing with the number of colors instead of the number of icons.
    colors_per_row = int(np.ceil(np.sqrt(len(nearest_colors))))
    colors_per_col = int(np.ceil(len(nearest_colors) / colors_per_row))
    overall_image_width = colors_per_row * sub_image_width
    overall_image_height = colors_per_col * sub_image_height

    # Now we can create the overall image and fill it with the colored icons.
    overall_image = Image.new("RGBA", (overall_image_width, overall_image_height), (0, 0, 0, 0))

    # Now we can fill the overall image with the colored icons.
    for color_index, color in enumerate(nearest_colors):
        # Create a sub-image for this color
        sub_image = Image.new("RGBA", (sub_image_width, sub_image_height), (0, 0, 0, 0))

        for icon_index, icon_file in enumerate(icon_files):
            colored_icon = color_strategic_icon(icon_file, color)
            row = icon_index // icons_per_row
            col = icon_index % icons_per_row
            x = col * max_icon_width
            y = row * max_icon_height
            sub_image.paste(colored_icon, (x, y), colored_icon)

        # Paste the sub-image into the overall image
        row = color_index // colors_per_row
        col = color_index % colors_per_row
        x = col * sub_image_width
        y = row * sub_image_height
        overall_image.paste(sub_image, (x, y), sub_image)

    # Save the overall image
    overall_image.save(save_path)
    print(f"Saved generated image to {save_path}")

    


if __name__ == "__main__":
    main()

# synchronous: #f47d1f
# legonis machina: #00b0ff
# foundation: #9157c7
# revenants: #ec2223
# gwo cluster: #808080
# gwo synchronous: #7ee265
