// src/ui/Popup.ts

import { fs, s } from './scale';

export const POPUP = {
  TABLE: {
    // ⚠️ width & height are intentionally NOT defined here
    // They must be applied dynamically where screen size is known

    titleFont: fs(18),
    headerFont: fs(18),
    bodyFont: fs(15),
    closeFont: fs(18),
  },

  EDIT: {
    // ⚠️ width is intentionally NOT defined here
    // Component decides width based on screen size

    padding: s(16),
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
