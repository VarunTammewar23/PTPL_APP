// src/ui/Popup.ts

export const POPUP = {
  TABLE: {
    width: 1000,
    maxHeight: 600,

    titleFont: 18,
    headerFont: 18,
    bodyFont: 15,
    closeFont: 18,
  },

  EDIT: {
    width: 600,
    padding: 16,
    borderRadius: 12,

    titleFont: 20,
    inputFont: 18,

    button: {
      fontSize: 18,
      paddingV: 12,
      paddingH: 20,
    },
  },

  VIDEO: {
    width: 900,
    maxHeight: 600,
    borderRadius: 12,
  },
} as const;
