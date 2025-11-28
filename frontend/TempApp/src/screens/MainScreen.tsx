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
  Button,
  Modal,
  FlatList,
  Pressable,
  Animated,
  NativeModules,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  LayoutRectangle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RecipeTable from '../components/RecipeTable';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { ToastAndroid } from 'react-native';
import { API_BASE } from "@env";
import * as XLSX from 'xlsx';
import HeaderBar from '../components/HeaderBar';

const { FilePickerModule } = NativeModules;
const { width: SCREEN_W } = Dimensions.get('window');

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
  value_01: number;
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

  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);

  // BOTTOM PANEL
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const panelAnim = useRef(new Animated.Value(300)).current;

  // Side-menu (RPF) state
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [sideMenuTop, setSideMenuTop] = useState<number>(120);
  const [sideMenuLeft, setSideMenuLeft] = useState<number>(12);

  // Store layout for each pill using onLayout (more reliable)
  const [pillLayouts, setPillLayouts] = useState<Record<string, LayoutRectangle>>({});

  const ITEM_H = 54;
  const MENU_W = 140;
  const MENU_PADDING = 6;
  const RPF_ITEMS = [
    'PAPER SIZES','NO OF FOLDS','OFFSET SETTINGS','GLUE/TAP QTY','SUCTION / GAP SET',
    'ALL SPEED','SIDE LAY','BLOWER SETTINGS','ROLLER GAP','FOLDING TRAY'
  ];

  const openSideMenuForPill = (label: string) => {
    const layout = pillLayouts[label];
    // fallback default if layout not available
    if (!layout) {
      setSideMenuLeft(12);
      setSideMenuTop(110);
      setShowSideMenu(true);
      setActivePanel('RPF');
      return;
    }

    const menuHeight = RPF_ITEMS.length * (ITEM_H + 8) - 8 + MENU_PADDING * 2;
    // compute left so menu centers on pill if possible
    let left = Math.round(layout.x + layout.width / 2 - MENU_W / 2);
    left = Math.max(6, Math.min(left, SCREEN_W - MENU_W - 6));
    // place above the pill
    let top = Math.round(layout.y - menuHeight - 8);
    if (top < 12) top = 12; // clamp top
    setSideMenuLeft(left);
    setSideMenuTop(top);
    setShowSideMenu(true);
    setActivePanel('RPF');
  };

  const openPanel = (name: string) => {
    if (name === 'RPF') {
      openSideMenuForPill(name);
      return;
    }
    setShowSideMenu(false);
    setActivePanel(name);
    Animated.timing(panelAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  const closePanel = () => {
    setShowSideMenu(false);
    Animated.timing(panelAnim, { toValue: 300, duration: 250, useNativeDriver: true }).start(() =>
      setActivePanel(null)
    );
  };

  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const res = await apiGet('/recipes', { params: { customer_code: customerCode }, timeout: 7000 });
      setRecipes(res.data.recipes || []);
    } catch (err) {
      Alert.alert('Error fetching recipes');
    } finally {
      setLoadingRecipes(false);
    }
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

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);
  useEffect(() => { selectedRecipeId !== -1 ? fetchRecipeParams(selectedRecipeId) : setRecipeParams([]); },
    [selectedRecipeId, fetchRecipeParams]
  );

  const selectedRecipeName =
    selectedRecipeId === -1 ? null : recipes.find(r => r.recipe_id === selectedRecipeId)?.recipe_name ?? null;

  const openDropdown = () => {
    if (recipes.length === 0) return Alert.alert('No recipes available');
    setDropdownVisible(true);
  };

  const onSelectRecipe = (id: number) => {
    setSelectedRecipeId(id);
    setDropdownVisible(false);
  };

  const renderDropdownItem = ({ item }: { item: Recipe }) => {
    const isSelected = item.recipe_id === selectedRecipeId;
    return (
      <Pressable
        onPress={() => onSelectRecipe(item.recipe_id)}
        style={[
          styles.dropdownItem,
          isSelected && styles.dropdownItemSelected,
        ]}
      >
        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
          {item.recipe_name}
        </Text>
      </Pressable>
    );
  };

  const downloadRecipeExcel = async () => {
    if (selectedRecipeId === -1) return Alert.alert("Select recipe first");
    try {
      const url = `${API_BASE}/recipes/${selectedRecipeId}/download`;
      const filePath = `${RNFS.DownloadDirectoryPath}/recipe_${selectedRecipeId}.xlsx`;
      const result = await RNFS.downloadFile({ fromUrl: url, toFile: filePath }).promise;
      if (result.statusCode !== 200) throw new Error("Download failed");
      ToastAndroid.show("Saved to Downloads!", ToastAndroid.LONG);
      await FileViewer.open(filePath);
    } catch (err: any) {
      Alert.alert("Error downloading", err.message);
    }
  };

  const sendToBackend = async (rows: any[]) => {
    try {
      const response = await fetch(`${API_BASE}/api/upload-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
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
    } catch (err) {
      Alert.alert("Excel Parse Error");
    }
  };

  const openMachineView = () => {
    if (selectedRecipeId === -1) return Alert.alert("Select a recipe first");
    navigation.navigate("Machine", {
      recipeId: selectedRecipeId,
      recipeName: selectedRecipeName,
    });
  };

  // labels used by bottom bar
  const labels = ["HOME/LOGIN","RECIPE","RPF","RT ANGLE","KNIFE 1","KNIFE 2","KNIFE 3","STP TRAY","CREASING"];

  return (
    <SafeAreaView style={[styles.safe, isDark ? styles.darkBg : styles.lightBg]}>

      <HeaderBar
        recipeId={selectedRecipeId}
        recipeName={selectedRecipeName}
        onSave={() => Alert.alert("Data Saved!")}
        onUpload={openPicker}
      />

      {/* RECIPE SELECTION */}
      <View style={{ flexDirection: "row", marginTop: 12 }}>
        <TouchableOpacity
          style={[styles.dropdownBox, isDark ? styles.darkCard : styles.lightCard]}
          onPress={openDropdown}
        >
          <Text style={[styles.dropdownText, isDark ? styles.textLight : styles.textDark]}>
            {selectedRecipeName ?? "Select recipe"}
          </Text>
          <Text style={[styles.chevron, isDark ? styles.textLight : styles.textDark]}>▾</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={downloadRecipeExcel}
          disabled={selectedRecipeId === -1}
          style={{
            width: 120, height: 50,
            backgroundColor: selectedRecipeId === -1 ? "#aaa" : "#007bff",
            borderRadius: 6, alignItems: "center", justifyContent: "center",
            flexDirection: "row", marginLeft: 8
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Download</Text>
          <Text style={{ color: "white", fontSize: 18, marginLeft: 6 }}>⬇</Text>
        </TouchableOpacity>
      </View>

      {/* MACHINE VIEW BUTTON */}
      {selectedRecipeId !== -1 && (
        <View style={{ marginTop: 10 }}>
          <Button title="Open Machine View" onPress={openMachineView} />
        </View>
      )}

      {/* DROPDOWN MODAL */}
      <Modal visible={dropdownVisible} animationType="fade" transparent onRequestClose={() => setDropdownVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
          <View style={[styles.modalContent, isDark ? styles.darkCard : styles.lightCard]}>
            <Text style={[styles.modalTitle, isDark ? styles.textLight : styles.textDark]}>Select recipe</Text>
            <FlatList data={recipes} keyExtractor={i => String(i.recipe_id)} renderItem={renderDropdownItem} />
          </View>
        </Pressable>
      </Modal>

      {/* PARAMETER TABLE */}
      <View style={{ flex: 1 }}>
        {loadingParams ? <ActivityIndicator /> :
          selectedRecipeId !== -1 ?
            recipeParams.length === 0 ?
              <Text style={isDark ? styles.textLight : styles.textDark}>No parameters for this recipe.</Text>
              : <RecipeTable data={recipeParams} darkMode={isDark} />
            : <Text style={[{ color: '#666' }, isDark ? styles.textLight : styles.textDark]}>
                Select a recipe to view its parameters.
              </Text>
        }
      </View>

      {/* Side menu overlay + anchored menu (RPF) */}
      {showSideMenu && activePanel === 'RPF' && (
        <TouchableWithoutFeedback onPress={() => { setShowSideMenu(false); setActivePanel(null); }}>
          <View style={styles.sideMenuOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.sideMenu, { top: sideMenuTop, left: sideMenuLeft, width: MENU_W }]}>
                <View style={styles.sideMenuInner}>
                  {RPF_ITEMS.map((it, i) => (
                    <TouchableOpacity key={it + i} style={styles.sideMenuButton} activeOpacity={0.9}>
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

      {/* ===== CUSTOM BOTTOM BAR ===== */}
      <View style={styles.bottomBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomBarScroll}
        >
          {labels.map((label, idx) => {
            const isActive = activePanel === label;
            return (
              <TouchableOpacity
                // capture layout for each pill so we can position menu above it
                onLayout={(e) => {
                  const { x, y, width, height } = e.nativeEvent.layout;
                  // note: layout.x/y are relative to parent ScrollView; we want absolute
                  // compute absolute X by summing scrollview offset: simpler approach:
                  // use measure? but measure is flaky inside scroll; instead get window coords by using onLayout of top container...
                  // however for most cases layout.x is sufficient to approximate; store it
                  setPillLayouts(prev => ({ ...prev, [label]: { x, y, width, height } }));
                }}
                key={label + idx}
                activeOpacity={0.9}
                onPress={() => {
                  if (label === 'RPF') {
                    if (showSideMenu) {
                      setShowSideMenu(false);
                      setActivePanel(null);
                    } else {
                      openSideMenuForPill(label);
                    }
                    return;
                  }
                  if (isActive) {
                    closePanel();
                  } else {
                    openPanel(label);
                  }
                }}
                style={[
                  styles.pillButton,
                  isActive && styles.pillButtonActive,
                  idx === labels.length - 1 && styles.lastPill,
                ]}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Exit button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              setPillLayouts(prev => ({ ...prev, EXIT: { x, y, width, height } }));
            }}
            onPress={() => {
              Alert.alert('Exit', 'Do you want to exit?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: () => { /* TODO: exit handler */ } }
              ]);
            }}
            style={[styles.exitPill, activePanel === 'EXIT' && styles.pillButtonActive]}
          >
            <Icon name="logout" size={18} color="#6b0f1a" style={{ marginRight: 8 }} />
            <Text style={styles.exitText}>EXIT</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* SLIDE PANEL (unchanged for non-RPF) */}
      <Animated.View style={[styles.panel, { transform: [{ translateY: panelAnim }] }]}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{activePanel} Controls</Text>
          <TouchableOpacity onPress={closePanel}><Text style={styles.panelClose}>✕</Text></TouchableOpacity>
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
  safe: { flex: 1, paddingVertical: 12, paddingHorizontal: 0 },
  dropdownBox: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownText: { fontSize: 16, flex: 1 },
  chevron: { marginLeft: 12, fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalContent: { maxHeight: '70%', borderRadius: 8, padding: 8 },
  modalTitle: { paddingVertical: 10, paddingHorizontal: 8, fontSize: 16, fontWeight: '600' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownItemSelected: { backgroundColor: '#e6f0ff' },
  dropdownItemText: { fontSize: 15 },
  dropdownItemTextSelected: { fontWeight: '700' },
  lightBg: { backgroundColor: '#fff' },
  darkBg: { backgroundColor: '#111' },
  lightCard: { backgroundColor: '#fff' },
  darkCard: { backgroundColor: '#222' },
  textLight: { color: '#fff' },
  textDark: { color: '#000' },

  bottomBarContainer: {
    borderTopWidth: 1,
    borderTopColor: '#cfcfcf',
    backgroundColor: '#e6e6e8',
    paddingVertical: 10,
  },
  bottomBarScroll: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  pillButton: {
    backgroundColor: '#e9e5f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 0,
    marginRight: 0,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderBottomColor: '#bdb6d9',
    borderRightColor: '#bdb6d9',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    height: 48,
  },

  lastPill: {
    borderRightWidth: 0,
  },

  pillButtonActive: {
    backgroundColor: '#d6d6d8',
    borderTopColor: '#bdbdbf',
    borderLeftColor: '#bdbdbf',
    borderBottomColor: '#ffffff',
    borderRightColor: '#ffffff',
  },

  pillText: {
    color: '#211f2e',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  pillTextActive: {
    color: '#000',
  },

  exitPill: {
    backgroundColor: '#ffd0d6',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 0,
    marginLeft: 0,
    marginRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: '#fff',
    borderLeftColor: '#fff',
    borderBottomColor: '#df9aa6',
    borderRightColor: '#df9aa6',
    borderWidth: 1,
    height: 48,
  },
  exitText: {
    color: '#6b0f1a',
    fontWeight: '800',
    fontSize: 14,
  },

  /* SIDE (LEFT) RPF SUBMENU */
  sideMenuOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    zIndex: 9998,
  },
  sideMenu: {
    position: 'absolute',
    zIndex: 9999,
  },
  sideMenuInner: {
    backgroundColor: '#eef0fb',
    padding: MENU_PADDING,
    borderWidth: 2,
    borderColor: '#bfbfbf',
    borderRadius: 4,
  },
  sideMenuButton: {
    height: ITEM_H,
    marginBottom: 8,
    backgroundColor: '#e9e5f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderBottomColor: '#bdb6d9',
    borderRightColor: '#bdb6d9',
    borderWidth: 1,
    overflow: 'hidden',
  },
  sideMenuGloss: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  sideMenuText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b1730',
    textAlign: 'center',
    paddingHorizontal: 6,
  },

  panel: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
    padding: 15, elevation: 20,
  },

  panelHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  panelTitle: { fontSize: 18, fontWeight: "700" },
  panelClose: { fontSize: 22, fontWeight: "bold" },
  panelItem: { paddingVertical: 12, fontSize: 16, borderBottomWidth: 1, borderColor: "#ddd" },
});
