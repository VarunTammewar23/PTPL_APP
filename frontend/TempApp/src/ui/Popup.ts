// src/ui/Popup.ts

import { fs, s } from './scale';

export const POPUP = {
TABLE: {
  padding: s(18),
  borderRadius: s(12),

  titleFont: fs(18),
  headerFont: fs(16),
  bodyFont: fs(15),
  closeFont: fs(18),
},


  EDIT: {
    // ⚠️ width is intentionally NOT defined here
    // Component decides width based on screen size

    padding: s(26),
    borderRadius: s(12),

    titleFont: fs(20),
    inputFont: fs(18),

    button: {
      fontSize: fs(18),
      paddingV: s(12),
      paddingH: s(20),
    },
  },

  VIDEO: {
    // ⚠️ width & height intentionally omitted
    // Applied dynamically in VideoModal

    borderRadius: s(12),
  },
} as const;

export const getEditPopupLayout = (
  screenW: number,
  screenH: number
) => {
  const isLandscape = screenW > screenH;

  return {
    width: isLandscape
      ? Math.min(screenW * 0.45, 520)
      : Math.min(screenW * 0.85, 360),

    padding: isLandscape
      ? POPUP.EDIT.padding * 1.3
      : POPUP.EDIT.padding,

    titleFont: isLandscape
      ? POPUP.EDIT.titleFont + 2
      : POPUP.EDIT.titleFont,

    inputFont: isLandscape
      ? POPUP.EDIT.inputFont + 2
      : POPUP.EDIT.inputFont,

    inputHeight: isLandscape ? 56 : undefined,
  };
};

export const getTablePopupLayout = (screenW: number, screenH: number) => {
  const isLandscape = screenW > screenH;

  return {
    width: isLandscape
      ? Math.min(screenW * 0.9, 1100)
      : Math.min(screenW * 0.95, 600),

    maxHeight: isLandscape
      ? Math.min(screenH * 0.85, 700)
      : Math.min(screenH * 0.75, 500),

    padding: POPUP.TABLE.padding,
    borderRadius: POPUP.TABLE.borderRadius,

    titleFont: POPUP.TABLE.titleFont,
    headerFont: POPUP.TABLE.headerFont,
    bodyFont: POPUP.TABLE.bodyFont,
    closeFont: POPUP.TABLE.closeFont,
  };
};


export const getVideoPopupLayout = (screenW: number, screenH: number) => {
  const isLandscape = screenW > screenH;

  return {
    width: isLandscape
      ? Math.min(screenW * 0.85, 1000)
      : Math.min(screenW * 0.95, 420),

    height: isLandscape
      ? Math.min(screenH * 0.8, 560)
      : Math.min(screenH * 0.35, 280),

    borderRadius: POPUP.VIDEO.borderRadius,
  };
};

