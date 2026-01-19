import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Reference tablet: 10.5 inch (your design)
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 800;

const scaleW = width / BASE_WIDTH;
const scaleH = height / BASE_HEIGHT;
const scale = Math.min(scaleW, scaleH);

export function s(size: number) {
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
}

export function fs(size: number) {
  // font scaling – gentler
  return Math.round(PixelRatio.roundToNearestPixel(size * Math.min(scale, 1.1)));
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}
