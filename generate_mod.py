#!/usr/bin/env python3
"""Generate the Co-op Galactic War file distribution package."""

import os
import shutil

# Define paths
WORKSPACE_ROOT = os.path.dirname(os.path.abspath(__file__))
DIST_FOLDER_NAME = "media"
DIST_ROOT = os.path.join(WORKSPACE_ROOT, DIST_FOLDER_NAME)

# Files to copy: (source_relative_path, destination_relative_path_in_media)
FILES_TO_COPY = [
    # UI files
    ("ui/main/game/galactic_war/gw_lobby/gw_lobby.js",
     "ui/main/game/galactic_war/gw_lobby/gw_lobby.js"),
    ("ui/main/game/galactic_war/gw_play/gw_play.js",
     "ui/main/game/galactic_war/gw_play/gw_play.js"),
    ("ui/main/game/galactic_war/gw_play/gw_play.css",
     "ui/main/game/galactic_war/gw_play/gw_play.css"),
    ("ui/main/game/galactic_war/gw_play/gw_play.html",
     "ui/main/game/galactic_war/gw_play/gw_play.html"),
    ("ui/main/game/live_game/live_game_action_bar.js",
     "ui/main/game/live_game/live_game_action_bar.js"),
    ("ui/main/game/connect_to_game/connect_to_game.js",
     "ui/main/game/connect_to_game/connect_to_game.js"),
    ("ui/main/game/gw_reconnect_loading/gw_reconnect_loading.html",
     "ui/main/game/gw_reconnect_loading/gw_reconnect_loading.html"),
    ("ui/main/game/gw_reconnect_loading/gw_reconnect_loading.css",
     "ui/main/game/gw_reconnect_loading/gw_reconnect_loading.css"),
    ("ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js",
     "ui/main/game/gw_reconnect_loading/gw_reconnect_loading.js"),
    ("ui/main/game/live_game/live_game.js",
     "ui/main/game/live_game/live_game.js"),
    ("ui/main/game/live_game/live_game_build_bar.js",
     "ui/main/game/live_game/live_game_build_bar.js"),
    # Server script files
    ("server-script/states/gw_lobby.js",
     "server-script/states/gw_lobby.js"),
    ("server-script/states/gw_campaign.js",
     "server-script/states/gw_campaign.js"),
    ("server-script/main.js",
     "server-script/main.js"),
    ("server-script/states/landing.js",
     "server-script/states/landing.js"),
    ("server-script/states/playing.js",
     "server-script/states/playing.js"),
]


def delete_old_dist():
    """Delete the old distribution folder if it exists."""
    if os.path.exists(DIST_ROOT):
        print(f"Deleting old distribution folder: {DIST_ROOT}")
        shutil.rmtree(DIST_ROOT)


def create_dist_structure():
    """Create the distribution folder structure."""
    print(f"Creating distribution folder: {DIST_ROOT}")
    os.makedirs(DIST_ROOT, exist_ok=True)


def copy_files():
    """Copy modified files to distribution structure."""
    for src_rel, dst_rel in FILES_TO_COPY:
        src = os.path.join(WORKSPACE_ROOT, src_rel)
        dst = os.path.join(DIST_ROOT, dst_rel)

        # Create destination directory
        os.makedirs(os.path.dirname(dst), exist_ok=True)

        if os.path.exists(src):
            print(f"  Copying {src_rel}")
            shutil.copy2(src, dst)
        else:
            print(f"  WARNING: Source file not found: {src}")


def main():
    """Main function to generate the distribution package."""
    print("=== Co-op Galactic War Distribution Package Generator ===\n")

    try:
        delete_old_dist()
        create_dist_structure()
        print("\nCopying files:")
        copy_files()

        print(f"\nDistribution package with {len(FILES_TO_COPY)} files generated successfully.")
        print(f"\nPackage location: {DIST_ROOT}")
        print(f"\nTo use this package:")
        print(f"1. Copy all files and folders from '{DIST_FOLDER_NAME}' to your PA Titans installation directory:")
        print(f"2. Hit F5 to reload the scripts and UI elements.")

    except Exception as e:
        print(f"\nError generating distribution package: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
