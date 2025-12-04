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
} from 'react-native';

import RecipeTable from '../components/RecipeTable';
import MachinePanel from '../Features/MachinePanel/RPF/PaperSizes';
import HeaderBar from '../components/HeaderBar';

import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';

import { apiGet } from '../api/api';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { ToastAndroid } from 'react-native';
import { API_BASE } from "@env";
import * as XLSX from 'xlsx';

import BottomBar from '../components/BottomBar';
import Folds from '../Features/MachinePanel/RPF/Folds';
import Offset from '../Features/MachinePanel/RPF/Offset';
import GlueTap from '../Features/MachinePanel/RPF/GlueTap';
import SuctionGap from '../Features/MachinePanel/RPF/SuctionGap';
import AllSpeed from '../Features/MachinePanel/RPF/AllSpeed';

import {
  buildFinalParamsForPanel
} from '../utils/panelSave';

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

  const [showMachine, setShowMachine] = useState<boolean>(false);
  const [showFolds, setShowFolds] = useState(false);
  const [showOffset, setShowOffset] = useState(false);
  const [showGlueTap, setShowGlueTap] = useState(false);
  const [showSuctionGap, setShowSuctionGap] = useState(false);
  const [showAllSpeed, setShowAllSpeed] = useState(false);

  const machineRef = useRef<any>(null);

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const panelAnim = useRef(new Animated.Value(SCREEN_H)).current;

  const [showSideMenu, setShowSideMenu] = useState(false);
  const [sideMenuLeft, setSideMenuLeft] = useState<number>(8);
  const [sideMenuTop, setSideMenuTop] = useState<number>(100);

  const rpfRef = useRef<any>(null);

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

  // PANEL OPEN LOGIC (UNCHANGED)
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

  // FETCH RECIPE LIST
  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const res = await apiGet("/recipes", {
        params: { customer_code: customerCode },
        timeout: 7000
      });
      setRecipes(res.data.recipes || []);
    } catch (err) {
      Alert.alert("Error fetching recipes");
    } finally {
      setLoadingRecipes(false);
    }
  }, [customerCode]);

  // FETCH PARAMS FOR SELECTED RECIPE
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

  // ======================================================================
  // SAVE + CREATE VERSION LOGIC
  // ======================================================================
  function getNextVersionName(baseName: string | null, allNames: string[]) {
    if (!baseName) return `recipe_${Date.now()}`;
    const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    return `${baseName}_${next}`;
  }

 const saveCurrentMachineData = async () => {
  console.log("=== SAVE BTN CLICKED ===");

  if (!showMachine) {
    console.log("Cannot save: Machine panel not open");
    return Alert.alert("Open PAPER SIZES (MachinePanel) first before saving.");
  }

  if (
    !machineRef.current ||
    typeof machineRef.current.getEditedValues !== "function"
  ) {
    console.log("Machine ref missing or incorrect");
    return Alert.alert("Machine data not ready");
  }

  // LOGGING VALUES
  const edited = machineRef.current.getEditedValues();
  const original = machineRef.current.getOriginalParams();
  const serials = machineRef.current.getSrList();

  console.log("Edited Values:", edited);
  console.log("Original Params:", original);
  console.log("Serial List:", serials);

  const finalParams = buildFinalParamsForPanel(serials, original, edited);

  console.log("Final Params to Save:", finalParams);

  if (!finalParams || finalParams.length === 0) {
    console.log("No params found to save");
    return Alert.alert("No parameters to save");
  }

  const allNames = recipes.map(r => r.recipe_name);
  const baseName = selectedRecipeName ?? `recipe_${Date.now()}`;
  const newRecipeName = getNextVersionName(baseName, allNames);

  console.log("New Recipe Name:", newRecipeName);

  const rows = finalParams.map(p => ({
    recipe_name: newRecipeName,
    customer_code: customerCode,
    section: p.section ?? "",
    parameter_no: p.parameter_no,
    parameter: p.parameter ?? "",
    value_01: p.value_01 ?? "",
    unit: p.unit ?? ""
  }));

  console.log("Final Rows Payload:", rows);

  try {
    const response = await fetch(`${API_BASE}/api/upload-excel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });

    const res = await response.json();
    console.log("Backend Response:", res);

    if (res.exists) {
      Alert.alert("Duplicate", res.message || "Recipe already exists");
      return;
    }

    if (res.success) {
      Alert.alert("Saved", `Created new recipe: ${newRecipeName}`);
      await fetchRecipes();

      if (res.newRecipeId) {
        setSelectedRecipeId(res.newRecipeId);
        setShowMachine(false);
      } else {
        const found = (recipes || []).find(
          r => r.recipe_name === newRecipeName
        );
        if (found) setSelectedRecipeId(found.recipe_id);
      }
    } else {
      Alert.alert("Error", res.message || "Failed to save recipe");
    }
  } catch (err: any) {
    console.log("NETWORK ERROR:", err);
    Alert.alert("Network error", err?.message ?? "Failed to save");
  }
};


  // ======================================================================
  // DOWNLOAD RECIPE EXCEL (RESTORED)
  // ======================================================================
  const downloadRecipeExcel = async () => {
    if (selectedRecipeId === -1) return Alert.alert("Select recipe first");
    try {
      const url = `${API_BASE}/recipes/${selectedRecipeId}/download`;
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

  // ======================================================================
  // UPLOAD EXCEL (RESTORED)
  // ======================================================================
  const sendToBackend = async (rows: any[]) => {
    try {
      const response = await fetch(`${API_BASE}/api/upload-excel`, {
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
    } catch {
      Alert.alert("Upload Error");
    }
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

  // ======================================================================
  // UI CONTENT (UNCHANGED)
  // ======================================================================
  const labels = [
    "HOME/LOGIN",
    "RECIPE",
    "RPF",
    "RT ANGLE",
    "KNIFE 1",
    "KNIFE 2",
    "KNIFE 3",
    "STP TRAY",
    "CREASING"
  ];

  return (
    <SafeAreaView
      style={[styles.safe, isDark ? styles.darkBg : styles.lightBg]}
    >
      <HeaderBar
        recipeId={selectedRecipeId}
        recipeName={selectedRecipeName}
        onSave={saveCurrentMachineData}
        onUpload={openPicker}
        onDownload={downloadRecipeExcel}
        recipes={recipes}
        selectedRecipeId={selectedRecipeId}
        selectedRecipeName={selectedRecipeName}
        onSelectRecipe={onSelectRecipe}
      />

      <View style={{ flex: 1 }}>
        {loadingParams ? (
          <ActivityIndicator />
        ) : selectedRecipeId === -1 ? (
          <Text
            style={[
              { color: "#666" },
              isDark ? styles.textLight : styles.textDark
            ]}
          >
            Select a recipe to view its parameters.
          </Text>
        ) : showMachine ? (
          <MachinePanel
            ref={machineRef}
            recipeId={selectedRecipeId}
            recipeName={selectedRecipeName ?? undefined}
            initialParams={recipeParams}
            onClose={() => setShowMachine(false)}
          />
        ) : showFolds ? (
          <Folds
            recipeId={selectedRecipeId}
            recipeName={selectedRecipeName ?? undefined}
            onClose={() => setShowFolds(false)}
          />
        ) : showOffset ? (
          <Offset
            recipeId={selectedRecipeId}
            recipeName={selectedRecipeName}
            onClose={() => setShowOffset(false)}
          />
        ) : showGlueTap ? (
          <GlueTap
            recipeId={selectedRecipeId}
            recipeName={selectedRecipeName}
            onClose={() => setShowGlueTap(false)}
          />
        ) : showSuctionGap ? (
          <SuctionGap
            recipeId={selectedRecipeId}
            recipeName={selectedRecipeName}
            onClose={() => setShowSuctionGap(false)}
          />
        ) : showAllSpeed ? (
          <AllSpeed
            recipeId={selectedRecipeId}
            recipeName={selectedRecipeName}
            onClose={() => setShowAllSpeed(false)}
          />
        ) : recipeParams.length === 0 ? (
          <Text>No parameters for this recipe.</Text>
        ) : (
          <RecipeTable data={recipeParams} darkMode={isDark} />
        )}
      </View>

      {/* SIDE MENU (UNCHANGED) */}
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

                        setShowSideMenu(false);
                        setActivePanel(null);

                        setShowMachine(false);
                        setShowFolds(false);
                        setShowOffset(false);
                        setShowGlueTap(false);
                        setShowSuctionGap(false);
                        setShowAllSpeed(false);

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
        rpfRef={rpfRef}
        onPressItem={label => {
          const isActive = activePanel === label;
          if (isActive && label !== "RPF") closePanel();
          else openPanel(label);
        }}
        onExit={() =>
          Alert.alert("Exit", "Do you want to exit?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Exit",
              style: "destructive",
              onPress: () => {}
            }
          ])
        }
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
      </Animated.View>
    </SafeAreaView>
  );
}

// ---------------- STYLES — DO NOT MODIFY ----------------
const styles = StyleSheet.create({
  safe: { flex: 1, paddingVertical: 12, paddingHorizontal: 0 },
  lightBg: { backgroundColor: "#fff" },
  darkBg: { backgroundColor: "#111" },
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
