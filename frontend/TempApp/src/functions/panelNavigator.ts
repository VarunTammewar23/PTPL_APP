// src/functions/panelNavigator.ts

export type PanelId =
  // RPF
  | 'PAPER_SIZES'
  | 'NO_OF_FOLDS'
  | 'OFFSET'
  | 'GLUE_TAP'
  | 'SUCTION_GAP'
  | 'ROLL_SPEED'
  | 'SIDE_LAY'
  | 'BLOWER'
  | 'ROLLER_GAP'
  | 'FOLDING_TRAY'

  // RT ANGLE
  | 'RT_FOLD_1'
  | 'RT_FOLD_2'
  | 'RT_GAP'

  // KNIFE
  | 'K1A' | 'K1B' | 'K1C'
  | 'K2A' | 'K2B' | 'K2C'
  | 'K3A' | 'K3B' | 'K3C'

  // OTHERS
  | 'STP_TRAY'
  | 'CREASING';

/**
 * Base fixed sequence (NO KNIVES)
 */
const BASE_SEQUENCE: PanelId[] = [
  // RPF
  'PAPER_SIZES',
  'NO_OF_FOLDS',
  'OFFSET',
  'GLUE_TAP',
  'SUCTION_GAP',
  'ROLL_SPEED',
  'SIDE_LAY',
  'BLOWER',
  'ROLLER_GAP',
  'FOLDING_TRAY',

  // RT ANGLE
  'RT_FOLD_1',
  'RT_FOLD_2',
  'RT_GAP',
];

/**
 * Knife blocks
 */
const KNIFE_1: PanelId[] = ['K1A', 'K1B', 'K1C'];
const KNIFE_2: PanelId[] = ['K2A', 'K2B', 'K2C'];
const KNIFE_3: PanelId[] = ['K3A', 'K3B', 'K3C'];

/**
 * Build final navigation sequence based on knife count
 */
export function buildNavigationSequence(
  knifeCount: number
): PanelId[] {
  const sequence: PanelId[] = [...BASE_SEQUENCE];

  if (knifeCount >= 1) sequence.push(...KNIFE_1);
  if (knifeCount >= 2) sequence.push(...KNIFE_2);
  if (knifeCount >= 3) sequence.push(...KNIFE_3);

  sequence.push('STP_TRAY');
  sequence.push('CREASING');

  return sequence;
}

/**
 * Get current panel index
 */
export function getCurrentIndex(
  sequence: PanelId[],
  current: PanelId | null
): number {
  if (!current) return -1;
  return sequence.indexOf(current);
}

/**
 * Resolve next / prev panel
 */
export function getNextPanel(
  sequence: PanelId[],
  current: PanelId | null,
  direction: 1 | -1
): PanelId | null {
  const idx = getCurrentIndex(sequence, current);
  if (idx === -1) return null;

  const target = idx + direction;
  if (target < 0 || target >= sequence.length) return null;

  return sequence[target];
}
