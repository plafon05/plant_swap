import type { PlantType } from '../types'

export const PLANT_TYPES: PlantType[] = [
  'flowering','cactus','fern','succulent','tropical','herb','tree','vine','other',
]

export const REGIONS = [
  'Москва','Санкт-Петербург','Новосибирск','Краснодар',
  'Казань','Екатеринбург','Нижний Новгород','Ростов-на-Дону',
]

export const TYPE_ICONS: Record<string, string> = {
  flowering: '🌸', cactus: '🌵', fern: '🌿', succulent: '🪴',
  tropical: '🌴', herb: '🌱', tree: '🌳', vine: '🍃', other: '🪻',
}

export const TYPE_COLORS: Record<string, string> = {
  flowering: '#e91e8c', cactus: '#4caf50', fern: '#2e7d32',
  succulent: '#8bc34a', tropical: '#ff9800', herb: '#00bcd4',
  tree: '#795548', vine: '#009688', other: '#9e9e9e',
}

const CARD_PALETTES: [string, string][] = [
  ['#e8f5e9','#a5d6a7'], ['#fce4ec','#f48fb1'], ['#e8eaf6','#9fa8da'],
  ['#fff3e0','#ffcc80'], ['#f3e5f5','#ce93d8'], ['#e0f7fa','#80deea'],
  ['#fafbe8','#dce775'], ['#fff8e1','#ffe082'],
]

export function getPlantPalette(id: number, name: string): { bg: string; accent: string } {
  const idx = (id + name.length) % CARD_PALETTES.length
  const [bg, accent] = CARD_PALETTES[idx]
  return { bg, accent }
}

export function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return 'сегодня'
  if (diff === 1) return 'вчера'
  if (diff < 30) return `${diff} дн. назад`
  if (diff < 365) return `${Math.floor(diff / 30)} мес. назад`
  return `${Math.floor(diff / 365)} г. назад`
}

export function initials(name?: string): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}