// src/utils/panelSave.ts
/**
 * NOTE ABOUT THIS FILE:
 * ----------------------
 * This file does NOT save anything to the backend.
 * It only prepares panel data before saving.
 *
 * Each panel displays a set of parameters (SR numbers).
 * The user may edit some values, while others remain original.
 *
 * panelSave.ts merges:
 *   → original values fetched from the backend
 *   → edited values from the UI panel state
 *
 * The result is a clean list of final parameters for that panel,
 * which can later be passed to a real SAVE function (API call).
 *
 * In short:
 *   UI collects edits
 *   panelSave.ts merges data
 *   saveMachinePanel.ts will send it to the backend
 */

export type RecipeParam = {
  parameter_no: number;
  section?: string;
  parameter?: string;
  value_01?: number | string;
  unit?: string;
};

export type EditedValues = Record<number, string | number | undefined>;

/**
 * Build final params list for a single panel.
 */
export function buildFinalParamsForPanel(
  srList: number[],
  originalParams: RecipeParam[] = [],
  editedValues: EditedValues = {},
  fallbackSection?: string
): RecipeParam[] {
  
  // Index originals by parameter_no
  const byNo: Record<number, RecipeParam> = {};
  for (const p of originalParams) {
    byNo[Number(p.parameter_no)] = p;
  }

  // Build final list for this panel only
  return srList.map((sr) => {
    const original = byNo[sr] ?? null;
    const edited = editedValues[sr];

    return {
      parameter_no: sr,
      section: original?.section ?? fallbackSection ?? "",
      parameter: original?.parameter ?? "",           // safe fallback
      value_01: edited !== undefined ? edited : (original?.value_01 ?? ""),
      unit: original?.unit ?? "",
    };
  });
}

/**
 * Merge final params arrays from multiple panels.
 * Later values overwrite earlier ones.
 */
export function mergePanelsFinalParams(
  panelsParams: RecipeParam[][]
): RecipeParam[] {
  const map = new Map<number, RecipeParam>();

  for (const arr of panelsParams) {
    for (const p of arr) {
      map.set(Number(p.parameter_no), p);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => Number(a.parameter_no) - Number(b.parameter_no)
  );
}

/**
 * Build the save payload for backend.
 */
export function buildSavePayload(
  recipeId: number | undefined,
  recipeName: string,
  params: RecipeParam[]
) {
  const payload: any = {
    recipe_name: recipeName,
    params,
  };

  if (recipeId !== undefined && recipeId !== -1) {
    payload.recipe_id = recipeId;
  }

  return payload;
}
