# Upscale test assets

- `nearest-4x/`: all 41 decoded game images, scaled 4x with nearest-neighbor.
  Original filenames and hill directory layout are retained. Alpha was verified.
- `realesrgan-4x/`: two AI test crops only, not complete game assets.
- `samples/`: original-resolution crops used for the AI test.
- `comparison.png`: nearest-neighbor versus RealESRGAN comparison.

Generated from comfyui/data/skijump3_work/assets with apps.image_upscale.
RealESRGAN checkpoint: RealESRGAN_x4plus.pth. All outputs use scale 4.
Original game assets retain the project's GPL-3.0 licensing and credits.

The game’s Upscaled graphics toggle uses the complete nearest-4x set.
It scales source rectangles and the canvas backing resolution by four, keeping
logical game coordinates and physics unchanged. The RealESRGAN crops are
comparison samples and are not loaded by the game.
