// src/screens/MainScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Animated,
  NativeModules,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import RecipeTable from '../components/RecipeTable';
import MachinePanel from '../components/PaperSizes';
import HeaderBar from '../components/HeaderBar';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { ToastAndroid } from 'react-native';
import * as XLSX from 'xlsx';
import BottomBar from '../components/BottomBar';
import Folds from '../components/Folds';
import Offset from '../components/Offset';
import GlueTap from '../components/GlueTap';
import SuctionGap from '../components/SuctionGap';
import AllSpeed from '../components/AllSpeed';
import SideLay from '../components/SideLay';
import BlowerSettings from '../components/BlowerSettings';
import RollerGap from '../components/RollerGap';
import { getCurrentApiBase } from '../config/ConfigContext';
import FoldingTray from '../components/FoldingTray';





const { FilePickerModule } = NativeModules;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface MainScreenProps {
  customerCode: string;
  onLogout?: () => void;
}

interface Recipe {
  recipe_id: number;
  recipe_name: string;
}

interface RecipeParam {
  parameter_no: number;
  section: string;
  parameter: string;
  value_01: number | string;
  unit: string;
}

export default function MainScreen({ customerCode }: MainScreenProps) {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number>(-1);
  const [recipeParams, setRecipeParams] = useState<RecipeParam[]>([]);

  const [loadingRecipes, setLoadingRecipes] = useState<boolean>(true);
  const [loadingParams, setLoadingParams] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [showMachine, setShowMachine] = useState<boolean>(false);
  const [showFolds, setShowFolds] = useState(false);
  const [showOffset, setShowOffset] = useState(false);
  const [showGlueTap, setShowGlueTap] = useState(false);
  const [showSuctionGap, setShowSuctionGap] = useState(false);
  const [showAllSpeed, setShowAllSpeed] = useState(false);
  const [showSideLay, setShowSideLay] = useState(false);
  const [showBlowerSettings, setShowBlowerSettings] = useState(false);
  const [showRollerGap, setShowRollerGap] = useState(false);
  const [showFoldingTray, setShowFoldingTray] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);





  const machineRef = useRef<any>(null);
  const foldsRef = useRef<any>(null);
  const offsetRef = useRef<any>(null);
  const glueRef = useRef<any>(null);
  const suctionRef = useRef<any>(null);
  const allSpeedRef = useRef<any>(null);
  const sideLayRef = useRef<any>(null);
  const blowerRef = useRef<any>(null);
  const rollerRef = useRef<any>(null);
  const foldingTrayRef = useRef<any>(null);
  // 🔴 Holds unsaved changes across ALL panels
  const pendingEditsRef = useRef<Map<number, any>>(new Map());

// 🔴 Capture edits from ANY panel, ANY time
const onParamEdit = (p: any) => {
  if (!p || typeof p.parameter_no !== 'number') return;

  pendingEditsRef.current.set(p.parameter_no, {
    ...pendingEditsRef.current.get(p.parameter_no),
    ...p,
  });
};


  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [activeRpfSub, setActiveRpfSub] = useState<string | null>(null);
  const panelAnim = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
  setActivePanel("HOME");
}, []);


  const [showSideMenu, setShowSideMenu] = useState(false);
  const [sideMenuLeft, setSideMenuLeft] = useState<number>(8);
  const [sideMenuTop, setSideMenuTop] = useState<number>(100);

  const rpfRef = useRef<any>(null);

  const ITEM_H = 54;
  const MENU_W = 140;
  const MENU_PADDING = 6;

  const RPF_ITEMS = [
    "PAPER SIZES",
    "NO OF FOLDS",
    "OFFSET SETTINGS",
    "GLUE/TAP QTY",
    "SUCTION / GAP SET",
    "ALL SPEED",
    "SIDE LAY",
    "BLOWER SETTINGS",
    "ROLLER GAP",
    "FOLDING TRAY"
  ];

  // 🔥 FIXED RPF SUBMENU LOGIC — NOTHING ELSE CHANGED
  const openPanel = (name: string) => {
    if (name === "RPF") {
      if (showSideMenu) {
        setShowSideMenu(false);
        setActivePanel(null);
        return;
      }

      rpfRef.current?.measure(
        (fx: number, fy: number, width: number, height: number, px: number, py: number) => {
          const ITEM_H_NEW = 38;
          const ITEM_GAP = 4;

          const menuHeight =
            RPF_ITEMS.length * (ITEM_H_NEW + ITEM_GAP) -
            ITEM_GAP +
            MENU_PADDING * 2;

          let left = Math.round(px);
          left = Math.max(6, Math.min(left, SCREEN_W - MENU_W - 6));

          let top = Math.round(py - menuHeight);
          if (top < 8) top = 8;

          setSideMenuLeft(left);
          setSideMenuTop(top);

          setShowSideMenu(true);
          setActivePanel("RPF");

          panelAnim.setValue(SCREEN_H);
        }
      );

      return;
    }

    setShowSideMenu(false);
    setActivePanel(name);
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    }).start();
  };

  const closePanel = () => {
    setShowSideMenu(false);
    Animated.timing(panelAnim, {
      toValue: SCREEN_H,
      duration: 250,
      useNativeDriver: true
    }).start(() => setActivePanel(null));
  };

  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const res = await apiGet("/recipes", {
        params: { customer_code: customerCode },
        timeout: 7000
      });
      const list = res.data.recipes || [];
      setRecipes(list);
      return list;
    } catch (err) {
      Alert.alert("Error fetching recipes");
      return [];
    } finally {
      setLoadingRecipes(false);
    }
  }, [customerCode]);

  useEffect(() => {
  if (!customerCode) return;

  const fetchCustomerName = async () => {
    try {
      const res = await apiGet('/customers/by-code', {
        params: { customer_code: customerCode },
      });
      setCustomerName(res.data?.customer_name ?? null);
    } catch {
      setCustomerName(null);
    }
  };

  fetchCustomerName();
}, [customerCode]);


  const fetchRecipeParams = useCallback(async (id: number) => {
    setLoadingParams(true);
    try {
      const res = await apiGet(`/recipes/${id}`, { timeout: 10000 });
      setRecipeParams(res.data.params || []);
    } catch {
      setRecipeParams([]);
    } finally {
      setLoadingParams(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (selectedRecipeId !== -1) {
      fetchRecipeParams(selectedRecipeId);
    } else {
      setRecipeParams([]);
    }
  }, [selectedRecipeId, fetchRecipeParams]);

  const selectedRecipeName =
    selectedRecipeId === -1
      ? null
      : recipes.find(r => r.recipe_id === selectedRecipeId)?.recipe_name ?? null;

  const onSelectRecipe = (id: number) => {
    setSelectedRecipeId(id);
    setShowMachine(false);
  };

  // Excel download
  const downloadRecipeExcel = async () => {
    if (selectedRecipeId === -1) return Alert.alert("Select recipe first");
    try {
      const url = `${getCurrentApiBase()}/recipes/${selectedRecipeId}/download`;
      const filePath = `${RNFS.DownloadDirectoryPath}/recipe_${selectedRecipeId}.xlsx`;
      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath
      }).promise;
      if (result.statusCode !== 200) throw new Error("Download failed");
      ToastAndroid.show("Saved to Downloads!", ToastAndroid.LONG);
      await FileViewer.open(filePath);
    } catch (err: any) {
      Alert.alert("Error downloading", err.message);
    }
  };

  const sendToBackend = async (rows: any[]) => {
    try {
      const response = await fetch(`${getCurrentApiBase()}/api/upload-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows })
      });

      const res = await response.json();
      if (res.exists) return Alert.alert("Duplicate Recipe", res.message);

      if (res.success) {
        Alert.alert("Success", "Excel uploaded successfully");
        await fetchRecipes();
        res.newRecipeId && setSelectedRecipeId(res.newRecipeId);
      }
    } catch {}
  };

  const openPicker = async () => {
    try {
      const uri = await FilePickerModule.openFilePicker();
      const base64 = await RNFS.readFile(uri, "base64");
      const workbook = XLSX.read(base64, { type: "base64" });
      const sheetName = workbook.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      sendToBackend(jsonData);
    } catch {
      Alert.alert("Excel Parse Error");
    }
  };

  function getNextVersionName(baseName: string | null, allNames: string[]) {
    if (!baseName) return `recipe_${Date.now()}`;

    // Decide parent name for versioning:
    // - If baseName has two or more trailing numeric segments (e.g. "recipe_01_01"),
    //   treat its parent as baseName without the last numeric segment ("recipe_01").
    // - If baseName has only one trailing numeric segment (e.g. "recipe_02"),
    //   treat parent = baseName (so child names become "recipe_02_01", ...).
    const parts = baseName.split("_");
    let trailingNumeric = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i])) trailingNumeric++;
      else break;
    }

    const parent = trailingNumeric >= 2 ? parts.slice(0, parts.length - 1).join("_") : baseName;

    const escaped = parent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped}_(\\d+)$`);

    let max = 0;
    allNames.forEach(n => {
      const m = n.match(regex);
      if (m && m[1]) {
        const num = parseInt(m[1], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });

    const next = (max + 1).toString().padStart(2, "0");
    return `${parent}_${next}`;
  }

  const saveCurrentMachineData = async () => {
    // Determine which panel is active and use its ref to collect params.
    let panelRef: any = null;
    if (showMachine) panelRef = machineRef;
    else if (showFolds) panelRef = foldsRef;
    else if (showOffset) panelRef = offsetRef;
    else if (showGlueTap) panelRef = glueRef;
    else if (showSuctionGap) panelRef = suctionRef;
    else if (showAllSpeed) panelRef = allSpeedRef;
    else if (showSideLay) panelRef = sideLayRef;
    else if (showBlowerSettings) panelRef = blowerRef;
    else if (showRollerGap) panelRef = rollerRef;
    else if (showFoldingTray) panelRef = foldingTrayRef;
    else panelRef = machineRef; // fallback


    // 1️⃣ Get changed params ONLY from active panel
let changedParams: any[] = [];
try {
  const maybe = panelRef?.current?.getFinalParams;
  if (maybe) {
    const result = panelRef.current.getFinalParams();
    changedParams = result instanceof Promise ? await result : result;
  }
} catch {
  changedParams = [];
}

// 2️⃣ Build lookup of changed params by parameter_no
const changedMap = new Map<number, any>();
changedParams.forEach((p: any) => {
  if (typeof p?.parameter_no === 'number') {
    changedMap.set(p.parameter_no, p);
  }
});

// 3️⃣ Merge ALL recipe params (1–300) with changes
// 🔴 Merge full recipe (1–300) with ALL pending edits
const mergedParams = recipeParams.map((orig) => {
  const changed = pendingEditsRef.current.get(orig.parameter_no);
  return changed
    ? { ...orig, ...changed }
    : orig;
});



    let newRecipeName = getNextVersionName(selectedRecipeName, recipes.map(r => r.recipe_name));

    // 4️⃣ Build backend rows from FULL merged params
const rows = mergedParams.map((p: any) => ({
  recipe_name: newRecipeName,
  customer_code: customerCode,
  customer_name: customerName ?? "",   // 🔴 ADD THIS
  section: p.section ?? "",
  parameter_no: p.parameter_no,
  parameter: p.parameter ?? "",
  value_01: p.value_01 ?? "",
  unit: p.unit ?? ""
}));
console.log('FIRST ROW BEING SAVED:', rows[0]);


    // Basic validation: don't send empty/invalid rows
    const isValidRow = (r: any) => {
      if (!r) return false;
      // parameter_no should be a number OR parameter name or value should be present
      const hasParamNo = typeof r.parameter_no === 'number' && !isNaN(r.parameter_no);
      const hasParameter = typeof r.parameter === 'string' && r.parameter.trim().length > 0;
      const hasValue = r.value_01 !== null && r.value_01 !== undefined && (`${r.value_01}`).trim().length > 0;
      return hasParamNo || hasParameter || hasValue;
    };

    const filteredRows = rows.filter(isValidRow);

    if (!newRecipeName || /^\d+$/.test(newRecipeName)) {
      // avoid numeric-only recipe names (defensive)
      newRecipeName = `recipe_${Date.now()}`;
      filteredRows.forEach((rr: any) => (rr.recipe_name = newRecipeName));
    }

    if (filteredRows.length === 0) {
      return Alert.alert('No changes', 'There are no parameter changes to save');
    }

    if (saving) return Alert.alert('Please wait', 'Save already in progress');
    setSaving(true);

    const clearAllPanelTemp = () => {
      [
        machineRef,
        foldsRef,
        offsetRef,
        glueRef,
        suctionRef,
        allSpeedRef,
        sideLayRef,
        blowerRef,
        rollerRef,
      ].forEach(r => {
        try {
          if (r?.current?.clearEdits) r.current.clearEdits();
        } catch (e) {
          // ignore
        }
      });
    };

    try {
      const response = await fetch(`${getCurrentApiBase()}/api/upload-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows })
      });

      const res = await response.json();
      console.warn('upload-excel response', res);

      // Refresh recipes and try to locate the created recipe
      const updated = await fetchRecipes();
      const found = (updated || []).find((r: any) => r.recipe_name === newRecipeName);

     if (res && res.success) {
  // 🔴 CLEAR accumulated edits AFTER successful save
  pendingEditsRef.current.clear();

  Alert.alert("Saved", `Created new recipe: ${newRecipeName}`);
  if (res.newRecipeId) setSelectedRecipeId(res.newRecipeId);
  else if (found) setSelectedRecipeId(found.recipe_id);

  clearAllPanelTemp();
  setShowMachine(false);
  setShowFolds(false);
  setShowOffset(false);
  setShowGlueTap(false);
  setShowSuctionGap(false);
  setShowAllSpeed(false);
  setShowSideLay(false);
  setShowBlowerSettings(false);
  setShowRollerGap(false);
  setShowFoldingTray(false);

  setSaving(false);
  return;
}


      if (res && res.exists) {
        pendingEditsRef.current.clear(); // 🔴 IMPORTANT

        if (found) {
          setSelectedRecipeId(found.recipe_id);
          clearAllPanelTemp();
          setShowMachine(false);
          setShowFolds(false);
          setShowOffset(false);
          setShowGlueTap(false);
          setShowSuctionGap(false);
          setShowAllSpeed(false);
          setShowSideLay(false);
          setShowBlowerSettings(false);
          setShowRollerGap(false);
          setShowFoldingTray(false);

          Alert.alert('Exists', `Recipe already exists. Opened ${newRecipeName}`);
        } else {
          Alert.alert('Duplicate', res.message || 'Recipe already exists');
        }
        setSaving(false);
        return;
      }

      console.warn('upload-excel unexpected response', res);
      Alert.alert('Error', res?.message || 'Failed to save recipe');
      setSaving(false);
      return;
    } catch (err: any) {
      // On network error, refresh list to detect any side-effect creations
      const updated = await fetchRecipes();
      const foundAfter = (updated || []).find((r: any) => r.recipe_name === newRecipeName);
      if (foundAfter) {

        // 🔴 IMPORTANT: clear accumulated cross-panel edits
    pendingEditsRef.current.clear();
        setSelectedRecipeId(foundAfter.recipe_id);
        clearAllPanelTemp();
        setShowMachine(false);
        setShowFolds(false);
        setShowOffset(false);
        setShowGlueTap(false);
        setShowSuctionGap(false);
        setShowAllSpeed(false);
        setShowSideLay(false);
        setShowBlowerSettings(false);
        setShowRollerGap(false);
        setShowFoldingTray(false);

        Alert.alert('Saved (server)', `Recipe created on server: ${newRecipeName}`);
      } else {
        Alert.alert('Network error', err?.message ?? 'Failed to save');
      }
      setSaving(false);
      return;
    }
  };

  const labels = [
    "HOME",
    "RECIPE",
    "RPF",
    "RT ANGLE",
    "KNIFE 1",
    "KNIFE 2",
    "KNIFE 3",
    "STP TRAY",
    "CREASING"
  ];

    // 🟢 ADD THIS FUNCTION HERE — BELOW labels[] and ABOVE return()
  function getScreenTitle() {
    if (showMachine) return "RPF : PAPER SIZES";
    if (showFolds) return "RPF : NO OF FOLDS";
    if (showOffset) return "RPF : OFFSET SETTINGS";
    if (showGlueTap) return "RPF : GLUE/TAP QTY";
    if (showSuctionGap) return "RPF : SUCTION / GAP SET";
    if (showAllSpeed) return "RPF : ALL SPEED";
    if (showSideLay) return "RPF : SIDE LAY";
    if (showBlowerSettings) return "RPF : BLOWER SETTINGS";
    if (showRollerGap) return "RPF : ROLLER GAP";
    if (showFoldingTray) return "RPF : FOLDING TRAY";
    return null;
  }


  return (
    <SafeAreaView
      style={[styles.safe, isDark ? styles.darkBg : styles.lightBg]}
    >
      <HeaderBar
        recipeId={selectedRecipeId}
        recipeName={selectedRecipeName}
        onUpload={openPicker}
        recipes={recipes}
        selectedRecipeId={selectedRecipeId}
        selectedRecipeName={selectedRecipeName}
        onSelectRecipe={onSelectRecipe}
        onDownload={downloadRecipeExcel}
        screenTitle={getScreenTitle()}
      />


      <View style={{ flex: 1 }}>
        {loadingParams ? (
          <ActivityIndicator />
        ) : selectedRecipeId === -1 ? (
          <View style={styles.noRecipeContainer}>
            <Image
              source={require('../assets/company_logo.jpeg')}
              style={styles.noRecipeLogo}
              resizeMode="contain"
            />
            <Text style={[styles.noRecipeText, isDark ? styles.textLight : styles.textDark]}>
              Select a recipe to view its parameters
            </Text>
          </View>
        ) : (
          <>
            <View style={{ flex: 1, display: showMachine ? 'flex' : 'none' }}>
              <MachinePanel
                ref={machineRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName ?? undefined}
                initialParams={recipeParams}
                onClose={() => setShowMachine(false)}
                onSave={saveCurrentMachineData}   // 👈 ADD THIS LINE
                onParamEdit={onParamEdit}   // 🔴 THIS LINE

              />
            </View>

            <View style={{ flex: 1, display: showFolds ? 'flex' : 'none' }}>
              <Folds
                ref={foldsRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName ?? undefined}
                initialParams={recipeParams}
                onClose={() => setShowFolds(false)}
                onSave={saveCurrentMachineData} //save
                onParamEdit={onParamEdit}   // 🔴 THIS LINE
              />
            </View>

            <View style={{ flex: 1, display: showOffset ? 'flex' : 'none' }}>
              <Offset
                ref={offsetRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName}
                initialParams={recipeParams}
                onClose={() => setShowOffset(false)}
                onSave={saveCurrentMachineData} //save
                onParamEdit={onParamEdit}   // 🔴 THIS LINE
              />
            </View>

            <View style={{ flex: 1, display: showGlueTap ? 'flex' : 'none' }}>
              <GlueTap
                ref={glueRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName}
                initialParams={recipeParams}
                onClose={() => setShowGlueTap(false)}
                onSave={saveCurrentMachineData} //save
                onParamEdit={onParamEdit}   // 🔴 THIS LINE
              />
            </View>

            <View style={{ flex: 1, display: showSuctionGap ? 'flex' : 'none' }}>
              <SuctionGap
                ref={suctionRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName}
                initialParams={recipeParams}
                onClose={() => setShowSuctionGap(false)}
                onSave={saveCurrentMachineData} //save
                onParamEdit={onParamEdit}   // 🔴 THIS LINE
              />
            </View>

            <View style={{ flex: 1, display: showAllSpeed ? 'flex' : 'none' }}>
              <AllSpeed
                ref={allSpeedRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName}
                initialParams={recipeParams}
                onClose={() => setShowAllSpeed(false)}
                onSave={saveCurrentMachineData} //save
                onParamEdit={onParamEdit}   // 🔴 THIS LINE
              />
            </View>

            <View style={{ flex: 1, display: showSideLay ? 'flex' : 'none' }}>
              <SideLay
                ref={sideLayRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName ?? undefined}
                initialParams={recipeParams}
                onClose={() => setShowSideLay(false)}
                onSave={saveCurrentMachineData} //save
                onParamEdit={onParamEdit}   // 🔴 THIS LINE
              />
            </View>

            <View style={{ flex: 1, display: showBlowerSettings ? 'flex' : 'none' }}>
              <BlowerSettings
                ref={blowerRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName ?? undefined}
                initialParams={recipeParams}
                onClose={() => setShowBlowerSettings(false)}
                onSave={saveCurrentMachineData} //save
                onParamEdit={onParamEdit}   // 🔴 THIS LINE
              />
            </View>

            <View style={{ flex: 1, display: showRollerGap ? 'flex' : 'none' }}>
              <RollerGap
                ref={rollerRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName ?? undefined}
                initialParams={recipeParams}
                onClose={() => setShowRollerGap(false)}
                imageScale={2}
                onSave={saveCurrentMachineData} //save
                onParamEdit={onParamEdit}   // 🔴 THIS LINE
              />
            </View>

            <View style={{ flex: 1, display: showFoldingTray ? 'flex' : 'none' }}>
              <FoldingTray
                ref={foldingTrayRef}
                recipeId={selectedRecipeId}
                recipeName={selectedRecipeName ?? undefined}
                initialParams={recipeParams}
                onClose={() => setShowFoldingTray(false)}
                onSave={saveCurrentMachineData} //save
                onParamEdit={onParamEdit}   // 🔴 THIS LINE
              />
            </View>


            <View
              style={{
                flex: 1,
                display:
                  !showMachine &&
                  !showFolds &&
                  !showOffset &&
                  !showGlueTap &&
                  !showSuctionGap &&
                  !showAllSpeed &&
                  !showSideLay &&
                  !showBlowerSettings &&
                  !showRollerGap &&
                  !showFoldingTray
                    ? 'flex'
                    : 'none',
              }}
            >
              {recipeParams.length === 0 ? (
                <Text>No parameters for this recipe.</Text>
              ) : (
                <RecipeTable data={recipeParams} darkMode={isDark} />
              )}
            </View>
          </>
        )}
      </View>

      {showSideMenu && activePanel === "RPF" && (
        <TouchableWithoutFeedback
          onPress={() => {
            setShowSideMenu(false);
            setActivePanel(null);
          }}
        >
          <View style={styles.sideMenuOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sideMenuFixed,
                  { left: sideMenuLeft, top: sideMenuTop }
                ]}
              >
                <View style={styles.sideMenuInner}>
                  {RPF_ITEMS.map((it, i) => (
                    <TouchableOpacity
                      key={it + i}
                      style={styles.sideMenuButton}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (selectedRecipeId === -1) {
                          Alert.alert("Select a recipe first");
                          return;
                        }
                        // Highlight RPF pill
                        setActivePanel("RPF");

                        // Highlight sub item
                        setActiveRpfSub(it);

                        setShowSideMenu(false);
                        setShowMachine(false);
                        setShowFolds(false);
                        setShowOffset(false);
                        setShowGlueTap(false);
                        setShowSuctionGap(false);
                        setShowAllSpeed(false);
                        setShowSideLay(false);
                        setShowBlowerSettings(false);
                        setShowRollerGap(false);
                        setShowFoldingTray(false);

                        if (it === "PAPER SIZES")
                          return setShowMachine(true);
                        if (it === "NO OF FOLDS")
                          return setShowFolds(true);
                        if (it === "OFFSET SETTINGS")
                          return setShowOffset(true);
                        if (it === "GLUE/TAP QTY")
                          return setShowGlueTap(true);
                        if (it === "SUCTION / GAP SET")
                          return setShowSuctionGap(true);
                        if (it === "ALL SPEED")
                          return setShowAllSpeed(true);
                        if (it === "SIDE LAY")
                          return setShowSideLay(true); // ⬅️ ADD THIS
                        if (it === "BLOWER SETTINGS")
                          return setShowBlowerSettings(true);
                        if (it === "ROLLER GAP") 
                          return setShowRollerGap(true);
                        if (it === "FOLDING TRAY")
                          return setShowFoldingTray(true);



                      }}
                    >
                      <View style={styles.sideMenuGloss} />
                      <Text style={styles.sideMenuText}>{it}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      <BottomBar
      labels={labels}
      activePanel={activePanel}
      activeRpfSub={activeRpfSub}
      rpfRef={rpfRef}
      onSave={saveCurrentMachineData}
      onPressItem={label => {
        // Highlight the pressed pill
        setActivePanel(label);

        if (label === "RECIPE") {
          setShowMachine(false);
          setShowFolds(false);
          setShowOffset(false);
          setShowGlueTap(false);
          setShowSuctionGap(false);
          setShowAllSpeed(false);
          setShowSideLay(false);
          setShowBlowerSettings(false);
          setShowRollerGap(false);
          setShowFoldingTray(false);

          return; // Recipe table will show
        }

        if (label === "HOME") {
          // Close everything and show company logo screen
          setShowMachine(false);
          setActivePanel("HOME");
          return;
        }

        const isActive = activePanel === label;
        if (isActive && label !== "RPF") closePanel();
        else openPanel(label);
      }}


      onExit={() =>
        Alert.alert("Exit", "Do you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => {} }
        ])
      }
      onSettings={() => navigation.navigate("Settings")}  // 👈 ADD THIS LINE
    />


      <Animated.View
        style={[styles.panel, { transform: [{ translateY: panelAnim }] }]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{activePanel} Controls</Text>
          <TouchableOpacity onPress={closePanel}>
            <Text style={styles.panelClose}>✕</Text>
          </TouchableOpacity>
        </View>

        {activePanel === "RPF" && (
          <>
            <Text style={styles.panelItem}>RPF1</Text>
            <Text style={styles.panelItem}>RPF2</Text>
            <Text style={styles.panelItem}>RPF Gap Setting</Text>
            <Text style={styles.panelItem}>RPF Speed Setting</Text>
          </>
        )}

        {activePanel === "RT ANGLE" && (
          <>
            <Text style={styles.panelItem}>Rotate Left</Text>
            <Text style={styles.panelItem}>Rotate Right</Text>
            <Text style={styles.panelItem}>Reset Angle</Text>
          </>
        )}

        {activePanel === "KNIFE 1" && (
          <>
            <Text style={styles.panelItem}>Knife 1 Width</Text>
            <Text style={styles.panelItem}>Knife 1 Speed</Text>
          </>
        )}

        {activePanel === "KNIFE 2" && (
          <>
            <Text style={styles.panelItem}>Knife 2 Width</Text>
            <Text style={styles.panelItem}>Knife 2 Pressure</Text>
          </>
        )}

        {activePanel === "Tray" && (
          <>
            <Text style={styles.panelItem}>Tray Up</Text>
            <Text style={styles.panelItem}>Tray Down</Text>
            <Text style={styles.panelItem}>Tray Reset</Text>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  noRecipeContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},

noRecipeLogo: {
  width: 260,   // adjust size as needed
  height: 160,
  marginBottom: 20,
},

noRecipeText: {
  fontSize: 18,
  fontWeight: '700',
  textAlign: 'center',
  color: '#666',
},

  safe: { flex: 1, paddingVertical: 0, paddingHorizontal: 0 },
  lightBg: { backgroundColor: "#fff" },
  darkBg: { backgroundColor: "#111" },
  lightCard: { backgroundColor: "#fff" },
  darkCard: { backgroundColor: "#222" },
  textLight: { color: "#fff" },
  textDark: { color: "#000" },

  sideMenuOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 9998
  },

  sideMenuFixed: {
    position: "absolute",
    zIndex: 9999,
    width: 140
  },

  sideMenuInner: {
    backgroundColor: "#eef0fb",
    padding: 6,
    borderWidth: 2,
    borderColor: "#bfbfbf",
    borderRadius: 4
  },

  // 🔥 FIXED BUTTON HEIGHT + GAP
  sideMenuButton: {
    height: 38,
    marginBottom: 4,
    backgroundColor: "#e9e5f6",
    justifyContent: "center",
    alignItems: "center",
    borderTopColor: "#ffffff",
    borderLeftColor: "#ffffff",
    borderBottomColor: "#bdb6d9",
    borderRightColor: "#bdb6d9",
    borderWidth: 1,
    overflow: "hidden"
  },

  sideMenuGloss: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.55)"
  },

  sideMenuText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1b1730",
    textAlign: "center",
    paddingHorizontal: 6
  },

  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 15,
    elevation: 20
  },

  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700"
  },
  panelClose: {
    fontSize: 22,
    fontWeight: "bold"
  },
  panelItem: {
    paddingVertical: 12,
    fontSize: 16,
    borderBottomWidth: 1,
    borderColor: "#ddd"
  }
});