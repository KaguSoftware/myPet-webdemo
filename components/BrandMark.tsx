import PixelSprite from "./pixel/PixelSprite";
import { CAT_SPRITE } from "./pixel/petSprites";

/**
 * The PetPal brand lockup for auth/config screens: the pixel mascot (the one
 * place pixel art belongs — the pets) over a clean wordmark.
 */
export default function BrandMark() {
  return (
    <div className="flex flex-col items-center">
      <PixelSprite sprite={CAT_SPRITE} size={48} className="pixelated" />
      <h1 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-label">PetPal</h1>
    </div>
  );
}
