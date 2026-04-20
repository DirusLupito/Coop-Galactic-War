# Client Mod Distribution From Host To All Players

## Purpose

This document explains a minimal, working design to share host client mods with other players.

The goal is to support both:

- UI mods (example: Galactic War Overhaul style UI files)
- Gameplay-impacting mods (example: unit and effect files under /pa)

This document keeps only proven, relevant information for a clean rebuild.

## What Success Looks Like

1. Host can publish all active client mod files, not a hardcoded subset.
2. Server stores that payload and forwards it to viewers and late joiners.
3. Viewer rebuilds files correctly, including binary assets.
4. Viewer mounts files before entering scenes that need them.
5. Scene scripts from synced mods are loaded so UI hooks actually run.
6. Both /pa and /ui mod content work in the same session.

## Files To Modify

### Host upload and viewer receive path

- ui/main/game/connect_to_game/connect_to_game.js

### Campaign server state and payload replay

- server-script/states/gw_campaign.js

### Lobby server state merge into gw_config

- server-script/states/gw_lobby.js

### Viewer lobby mount path

- ui/main/game/galactic_war/gw_lobby/gw_lobby.js

### Viewer play scene activation path

- ui/main/game/galactic_war/gw_play/gw_play.js

### Shared image resolver for synced binary assets (recommended)

- ui/main/game/galactic_war/shared/

Create one shared resolver file here and use it from UI components that bind icon/image URLs.

## High-Level Data Flow

1. Host discovers active client mods and all files under each mod mount path.
2. Host sends file data to server in message parts with metadata.
3. Server stores full per-mod payload and can replay it to late joiners.
4. Server includes synced files in launch context and gw_config.
5. Viewer receives data, rebuilds files, mounts memory files, then enters play scene.
6. Viewer merges synced mod scene script URLs into scene lists before loadMods runs.

## Message Design (Minimal Contract)

Use one clear message family for host upload and one for server replay.

### Host to server message

Message type: gw_campaign_client_mod_payload

Phases:

- begin
- file_part
- file_missing
- complete

Required fields:

- index: mod index or generated stable id
- phase
- mount_path
- mod: full mod metadata, especially scenes
- file_path
- file_part_index
- file_part_count
- data
- file_encoding: raw or base64

### Server to viewer message

Message type: gw_campaign_client_mod_sync

Use the same phase model and data fields so viewer logic is almost identical to server storage logic.

## Step-By-Step Build Plan

### 1) Host: collect all active client mods and all files

In ui/main/game/connect_to_game/connect_to_game.js:

1. Resolve active client mods from CommunityModsManager.
2. Do not hardcode one mod index.
3. For each mod, use its mountPath as the root.
4. Recursively list every file from that root.
5. Do not classify file vs directory using dot checks. Mod names contain dots.

Why this matters:

- Dot-based checks skip valid folders and silently drop files.

### 2) Host: read file data correctly

Use two read paths:

1. Text files: normal text read.
2. Binary files (png, jpg, webp, dds, papa, and so on): XHR arraybuffer, convert bytes to binary string.

Then:

1. For binary files, base64 encode before sending.
2. Set file_encoding to base64 for those file parts.
3. Keep chunk size fixed and predictable.

Why this matters:

- Sending raw binary through plain string path corrupts bytes.

### 3) Server: store payload by mod and by file

In server-script/states/gw_campaign.js:

1. Keep payload store keyed by mod id or index.
2. On begin, reset per-mod state.
3. On file_part, rebuild file text from parts.
4. Store file_encoding per file.
5. On complete, mark the mod payload complete.

Also:

1. Replay stored payload to late joiners using the same phase sequence.
2. Include all stored mods in launch context, not just one.

### 4) Server: normalize file keys for launch context

In server-script/states/gw_campaign.js and server-script/states/gw_lobby.js:

1. Normalize /client_mods/<mod>/... into canonical runtime keys.
2. Keep /pa paths intact for gameplay files.
3. Keep /ui paths intact for UI files.

Important:

- Do not normalize only /pa and ignore /ui. UI mods need those files preserved.
- This also goes for any other folder. There can be any number of mods with any internal structure, not just /pa and /ui.

### 5) Viewer: rebuild files and wait before redirect

In ui/main/game/connect_to_game/connect_to_game.js:

1. Rebuild each file from file_part chunks.
2. Decode base64 when file_encoding is base64.
3. Track per-mod completion.
4. Mount only when all expected mods are complete.
5. Delay redirect to gw_play until mount is finished.

Why this matters:

- If redirect happens too early, UI asks for files that are not mounted yet.

### 6) Viewer: load synced scene scripts

In ui/main/game/galactic_war/gw_lobby/gw_lobby.js and ui/main/game/galactic_war/gw_play/gw_play.js:

1. Build merged scene_mod_list entries from synced mod scene metadata.
2. Merge these entries before loadMods is called.

Why this matters:

- Mounted files alone are not enough. Scene scripts must also be loaded to activate UI behavior.

### 7) Binary image reliability: one shared fix for all UI surfaces

Observed behavior:

1. Some mounted binary files return status 200 in XHR.
2. The same URL can still fail in an img tag because bytes are treated as text.

Working general fix:

1. At mount time, build a map of canonical path -> base64 for synced binary assets.
2. Store it in session state.
3. Use one shared URL resolver used by all UI image bindings.
4. Resolver logic:
	- Try original URL first.
	- If load fails and path exists in the base64 map, return data:image/...;base64,...

Important:

- Do not keep adding one-off fallback code in each widget.
- Build one shared resolver and call it everywhere image URLs are assigned.

## Optional: Reuse Existing Server Mod Infrastructure

If you want faster transport with less custom code:

1. Reuse the existing server-mod upload path for transport and authentication.
2. Keep the same client-mod activation steps from this document:
	- canonical path normalization
	- binary-safe handling
	- scene mod merge before loadMods
	- mount-before-redirect ordering

Reason:

- Transport alone does not solve activation and timing problems.

## Common Failure Modes And Proven Fixes

### Failure: Only one mod appears synced

Cause:

- Hardcoded mod index.

Fix:

- Iterate all active client mods.

### Failure: Gameplay files work but UI mod files do not

Cause:

- Path normalization kept /pa but dropped or remapped /ui incorrectly.

Fix:

- Preserve canonical /ui paths as first-class synced files.

### Failure: Viewer gets 404 or missing hooks in UI

Cause:

- Scene scripts were not merged into scene_mod_list before loadMods.

Fix:

- Merge synced scene URLs in gw_lobby and gw_play before loadMods runs.

### Failure: Icons still fail after successful file transfer

Cause:

- Binary image bytes were interpreted as text in URL loading path.

Fix:

- Shared data URL fallback from prebuilt base64 asset map.

### Failure: Intermittent failure during scene entry

Cause:

- Redirect happened before sync mount completed.

Fix:

- Gate redirect until mount completion across all synced mods.

## Minimal Validation Checklist

### Host logs

1. Number of active mods discovered.
2. Files discovered per mod.
3. Binary files encoded count.
4. begin and complete sent for each mod.

### Server logs

1. begin and complete received for each mod.
2. Stored file count and encoded file count.
3. Replay sent to joiners.

### Viewer logs

1. All mods reached complete.
2. Base64 decode count is non-zero when binary exists.
3. Mount completed before redirect.
4. Scene mod merge count is non-zero for synced scenes.

### Runtime checks

1. UI mod behavior appears in gw_lobby and gw_play.
2. Gameplay mod changes under /pa are active in battle.
3. Late-joining viewer receives and activates the same content.

## Clean Rebuild Rules

1. No hardcoded mod ids.
2. No hardcoded filenames.
3. No mod-specific path hacks.
4. One shared image resolver for binary asset fallback.
5. Keep message contract stable and versioned if changed.

## Glossary

- mount path: root folder where one client mod is available on disk.
- canonical path: normalized runtime file key used consistently on server and client.
- binary file: file that must preserve exact byte values (png, jpg, dds, papa, and similar).
- base64: text encoding used to move binary safely through string channels.
- scene mod list: list of script URLs loaded for a scene before UI logic runs.
