import bottle from '../../../assets/icons/cosmetics/bottle.svg'
import perfume from '../../../assets/icons/cosmetics/perfume.svg'
import lipstick from '../../../assets/icons/cosmetics/lipstick.svg'
import lotionOutline from '../../../assets/icons/cosmetics/lotion-outline.svg'
import eyedropper from '../../../assets/icons/cosmetics/eyedropper.svg'
import bottleTonicOutline from '../../../assets/icons/cosmetics/bottle-tonic-outline.svg'
import sprayBottle from '../../../assets/icons/cosmetics/spray-bottle.svg'
import spray from '../../../assets/icons/cosmetics/spray.svg'
import brush from '../../../assets/icons/cosmetics/brush.svg'
import paletteSwatchOutline from '../../../assets/icons/cosmetics/palette-swatch-outline.svg'
import mirror from '../../../assets/icons/cosmetics/mirror.svg'
import hairDryerOutline from '../../../assets/icons/cosmetics/hair-dryer-outline.svg'
import razor from '../../../assets/icons/cosmetics/razor.svg'
import razorElectric from '../../../assets/icons/cosmetics/razor-electric.svg'
import pump from '../../../assets/icons/cosmetics/pump.svg'
import toothbrushPaste from '../../../assets/icons/cosmetics/toothbrush-paste.svg'

const icons = {
  'bottle': bottle,
  'perfume': perfume,
  'lipstick': lipstick,
  'lotion-outline': lotionOutline,
  'eyedropper': eyedropper,
  'bottle-tonic-outline': bottleTonicOutline,
  'spray-bottle': sprayBottle,
  'spray': spray,
  'brush': brush,
  'palette-swatch-outline': paletteSwatchOutline,
  'mirror': mirror,
  'hair-dryer-outline': hairDryerOutline,
  'razor': razor,
  'razor-electric': razorElectric,
  'pump': pump,
  'toothbrush-paste': toothbrushPaste,
}

type ProductIconId = keyof typeof icons
export const defaultProductIcon = 'bottle'
export const productIconIds = Object.keys(icons) as ProductIconId[]

export function getProductIcon(id: string | null) {
  return icons[productIconIds.find((key) => key === id) ?? defaultProductIcon]
}
