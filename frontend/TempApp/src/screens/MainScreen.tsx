// src/screens/MainScreen.tsx
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
  NativeModules  // ✅ Correct import
} from 'react-native';
import RecipeTable from '../components/RecipeTable';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { ToastAndroid } from 'react-native';
import { API_BASE } from "@env";
import * as XLSX from 'xlsx';
const { FilePickerModule } = NativeModules;



// --- Props Type ---
interface MainScreenProps {
  customerCode: string;
  onLogout?: () => void;
}

// --- Recipe types (optional but cleaner) ---
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


// --- Component ---
export default function MainScreen({ customerCode }: MainScreenProps) {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  

  // --- Bottom Panel State + Animation ---
const [activePanel, setActivePanel] = useState<string | null>(null);
const panelAnim = useRef(new Animated.Value(300)).current;

const openPanel = (name: string) => {
  setActivePanel(name);
  Animated.timing(panelAnim, {
    toValue: 0,
    duration: 250,
    useNativeDriver: true,
  }).start();
};

const closePanel = () => {
  Animated.timing(panelAnim, {
    toValue: 300,
    duration: 250,
    useNativeDriver: true,
  }).start(() => setActivePanel(null));
};


  const [recipes, setRecipes] = useState<Recipe[]>([]);
  // -1 sentinel means "no selection"
  const [selectedRecipeId, setSelectedRecipeId] = useState<number>(-1);
  const [recipeParams, setRecipeParams] = useState<RecipeParam[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState<boolean>(true);
  const [loadingParams, setLoadingParams] = useState<boolean>(false);
  const [_importedData, _setImportedData] = useState<any[]>([]);


  // dropdown modal visibility
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);

  // useCallback ensures stable function identity so useEffect deps are safe
  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const res = await apiGet('/recipes', {
        params: { customer_code: customerCode },
        timeout: 7000,
      });
      const list: Recipe[] = res.data.recipes || [];
      setRecipes(list);
    } catch (err: any) {
      console.warn('fetchRecipes error', err);
      Alert.alert('Error fetching recipes', err?.message || 'Network error');
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  }, [customerCode]);
 const downloadRecipeExcel = async () => {
  if (selectedRecipeId === -1) {
    Alert.alert("Select recipe first");
    return;
  }

  try {
    const url = `${API_BASE}/recipes/${selectedRecipeId}/download`;

    // File will be saved to Downloads
    const filePath = `${RNFS.DownloadDirectoryPath}/recipe_${selectedRecipeId}.xlsx`;

    console.log("Downloading to:", filePath);

    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
      background: true,
      discretionary: true,
    }).promise;

    if (result.statusCode !== 200) {
      throw new Error(`HTTP ${result.statusCode}`);
    }

    ToastAndroid.show("Saved to Downloads!", ToastAndroid.LONG);

    // Open the file using FileProvider compatible URI
    await FileViewer.open(filePath, {
      showOpenWithDialog: true,
      showAppsSuggestions: true,
    });

  } catch (err: any) {
    console.log("Download error:", err);
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
    console.log("Backend Insert Status:", res);

    if (res.success) {
      Alert.alert("Success", "Excel uploaded successfully");

      // 🔥 Refresh the recipes list
      await fetchRecipes();

      // 🔥 Auto-select the newly uploaded recipe
      const newRecipe = res.newRecipeId; // backend must send inserted recipe_id
      if (newRecipe) {
        setSelectedRecipeId(newRecipe);
        fetchRecipeParams(newRecipe);
      }
    } else {
      Alert.alert("Error", "Upload failed");
    }
  } catch (error) {
    console.log("Error uploading:", error);
  }
};




const openPicker = async () => {
  try {
    console.log("STEP 1: openPicker() CALLED");

    const uri = await FilePickerModule.openFilePicker();
    console.log("STEP 2: File URI =", uri);
    Alert.alert("Picker Result", uri);

    const base64 = await RNFS.readFile(uri, "base64");
    console.log("STEP 3: BASE64 LENGTH =", base64.length);

    // STEP 4: Parse Excel to workbook
    const workbook = XLSX.read(base64, { type: "base64" });
    console.log("STEP 4: Sheets =", workbook.SheetNames);
    Alert.alert("Sheets", workbook.SheetNames.join(", "));

    // STEP 5: Convert first sheet to JSON
    const sheetName = workbook.SheetNames[0];
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log("STEP 5: Parsed JSON =", jsonData);
    Alert.alert("Rows Parsed", JSON.stringify(jsonData).slice(0, 100) + "...");

    // STEP 6: Send to backend
    sendToBackend(jsonData);

  } catch (err) {
    console.log("Excel Parse Error:", err);
    Alert.alert("Excel Parse Error", JSON.stringify(err));
  }
};





  const fetchRecipeParams = useCallback(
    async (id: number) => {
      setLoadingParams(true);
      try {
        const res = await apiGet(`/recipes/${id}`, { timeout: 10000 });
        setRecipeParams(res.data.params || []);
      } catch (err: any) {
        console.warn('fetchRecipeParams error', err);
        Alert.alert('Error fetching recipe', err?.message || 'Network error');
        setRecipeParams([]);
      } finally {
        setLoadingParams(false);
      }
    },
    []
  );

  // run on mount and whenever fetchRecipes changes (i.e., when customerCode changes)
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // watch selectedRecipeId and the stable fetchRecipeParams function
  useEffect(() => {
    if (selectedRecipeId !== -1) fetchRecipeParams(selectedRecipeId);
    else setRecipeParams([]);
  }, [selectedRecipeId, fetchRecipeParams]);

  // Helper to open Machine screen
  const openMachineView = () => {
      

    if (selectedRecipeId === -1) {
      Alert.alert('Select a recipe first');
      return;
    }
    const recipeName = recipes.find((r) => r.recipe_id === selectedRecipeId)?.recipe_name;
    navigation.navigate('Machine', {
      recipeId: selectedRecipeId,
      recipeName,
      // imageUri: optional - pass here if you have a per-recipe image URL
    });
  };

  // ---- Custom Dropdown UI ----
  const selectedRecipeName =
    selectedRecipeId === -1 ? null : recipes.find((r) => r.recipe_id === selectedRecipeId)?.recipe_name ?? null;

  const openDropdown = () => {
    // if there are no recipes, give feedback
    if (recipes.length === 0) {
      Alert.alert('No recipes available');
      return;
    }
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
        style={({ pressed }) => [
          styles.dropdownItem,
          isSelected && styles.dropdownItemSelected,
          pressed && styles.dropdownItemPressed,
        ]}
      >
        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
          {item.recipe_name}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, isDark ? styles.darkBg : styles.lightBg]}>
      <View style={styles.headerRow}>
        <Text style={[styles.loggedText, isDark ? styles.textLight : styles.textDark]}>Logged as: {customerCode}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            accessible
            accessibilityLabel="Open settings"
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsBtn}
          >
            <Text style={isDark ? styles.textLight : styles.textDark}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginBottom: 12 }}>
        {loadingRecipes ? (
          <ActivityIndicator />
        ) : (
          <>
            {/* Visible pressable dropdown box: always shows placeholder or selected recipe + arrow */}
<View style={{ flexDirection: "row", alignItems: "center" }}>
  
  {/* Select Recipe Box */}
  <TouchableOpacity
    style={[
      styles.dropdownBox,
      {
        flex: 1,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 14,
        marginRight: 8,
        height: 50,  
        justifyContent: "center",
      },
      isDark ? styles.darkCard : styles.lightCard,
    ]}
    onPress={openDropdown}
    activeOpacity={0.8}
  >
    <Text style={[styles.dropdownText, isDark ? styles.textLight : styles.textDark]}>
      {selectedRecipeName ?? "Select recipe"}
    </Text>
    <Text style={[styles.chevron, isDark ? styles.textLight : styles.textDark]}>▾</Text>
  </TouchableOpacity>

  {/* Download Button */}
  <TouchableOpacity
    onPress={downloadRecipeExcel}
    disabled={selectedRecipeId === -1}
    style={{
      width: 120,   
      height: 50,   
      backgroundColor: selectedRecipeId === -1 ? "#aaa" : "#007bff",
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    }}
  >
    <Text style={{ color: "white", fontWeight: "600" }}>
      Download
    </Text>
    <Text style={{ color: "white", fontSize: 18, marginLeft: 6 }}>⬇</Text>
  </TouchableOpacity>

  <TouchableOpacity
  onPress={openPicker}
  style={{
    width: 120,
    height: 50,
    backgroundColor: "#28a745",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8
  }}
>
  <Text style={{ color: "white", fontWeight: "600" }}>
    Import
  </Text>
</TouchableOpacity>


</View>


            {/* Machine button */}
            {selectedRecipeId !== -1 ? (
              <View style={{ marginTop: 10 }}>
                <Button title="Open Machine View" onPress={openMachineView} />
              </View>
            ) : null}

            {/* Dropdown modal */}
            <Modal visible={dropdownVisible} animationType="fade" transparent onRequestClose={() => setDropdownVisible(false)}>
              <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
                <View style={[styles.modalContent, isDark ? styles.darkCard : styles.lightCard]}>
                  <Text style={[styles.modalTitle, isDark ? styles.textLight : styles.textDark]}>Select recipe</Text>
                  <FlatList
                    data={recipes}
                    keyExtractor={(it) => String(it.recipe_id)}
                    renderItem={renderDropdownItem}
                    showsVerticalScrollIndicator={true}
                  />
                </View>
              </Pressable>
            </Modal>
          </>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {loadingParams ? (
          <ActivityIndicator />
        ) : selectedRecipeId !== -1 ? (
          recipeParams.length === 0 ? (
            <Text style={isDark ? styles.textLight : styles.textDark}>No parameters for this recipe.</Text>
          ) : (
            <RecipeTable data={recipeParams} darkMode={isDark} />
          )
        ) : (
          <Text style={[{ color: '#666' }, isDark ? styles.textLight : styles.textDark]}>Select a recipe to view its parameters.</Text>
        )}
      </View>
      {/* --- Bottom Machine Control Bar --- */}
<View style={styles.bottomNav}>
  {["RPF", "RT Angle", "Knife 1", "Knife 2", "Tray"].map((label) => (
    <TouchableOpacity
      key={label}
      onPress={() => openPanel(label)}
      style={styles.navButton}
    >
      <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  ))}
</View>

{/* --- Slide Up Panel --- */}
<Animated.View style={[styles.panel, { transform: [{ translateY: panelAnim }] }]}>
  <View style={styles.panelHeader}>
    <Text style={styles.panelTitle}>{activePanel} Controls</Text>
    <TouchableOpacity onPress={closePanel}>
      <Text style={styles.panelClose}>✕</Text>
    </TouchableOpacity>
  </View>

  {/* RPF */}
  {activePanel === "RPF" && (
    <>
      <Text style={styles.panelItem}>RPF1</Text>
      <Text style={styles.panelItem}>RPF2</Text>
      <Text style={styles.panelItem}>RPF Gap Setting</Text>
      <Text style={styles.panelItem}>RPF Speed Setting</Text>
    </>
  )}

  {/* RT Angle */}
  {activePanel === "RT Angle" && (
    <>
      <Text style={styles.panelItem}>Rotate Left</Text>
      <Text style={styles.panelItem}>Rotate Right</Text>
      <Text style={styles.panelItem}>Reset Angle</Text>
    </>
  )}

  {/* Knife 1 */}
  {activePanel === "Knife 1" && (
    <>
      <Text style={styles.panelItem}>Knife 1 Width</Text>
      <Text style={styles.panelItem}>Knife 1 Speed</Text>
    </>
  )}

  {/* Knife 2 */}
  {activePanel === "Knife 2" && (
    <>
      <Text style={styles.panelItem}>Knife 2 Width</Text>
      <Text style={styles.panelItem}>Knife 2 Pressure</Text>
    </>
  )}

  {/* Tray */}
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
  safe: { flex: 1, padding: 12 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loggedText: { fontSize: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  settingsBtn: { padding: 8 },

  // dropdown box (closed state)
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  chevron: {
    marginLeft: 12,
    fontSize: 18,
  },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    maxHeight: '70%',
    borderRadius: 8,
    padding: 8,
  },
  modalTitle: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemPressed: {
    opacity: 0.6,
  },
  dropdownItemSelected: {
    backgroundColor: '#e6f0ff',
  },
  dropdownItemText: {
    fontSize: 15,
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
  },

  // theme
  lightBg: { backgroundColor: '#fff' },
  darkBg: { backgroundColor: '#111' },
  lightCard: { backgroundColor: '#fff' },
  darkCard: { backgroundColor: '#222' },
  textLight: { color: '#fff' },
  textDark: { color: '#000' },

  bottomNav: {
  flexDirection: "row",
  justifyContent: "space-between",   // 🔥 less gap, full width
  backgroundColor: "#1f1f1f",
  paddingVertical: 17,
  paddingHorizontal: 10,             // 🔥 add padding to stretch bar
  borderTopWidth: 1,
  borderColor: "#444",
},

navButton: {
  paddingHorizontal: 13,              // 🔥 reduced button width
  paddingVertical: 13,
  backgroundColor: "#007bff",
  borderRadius: 6,
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
  elevation: 20,
},

panelHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 10,
},

panelTitle: {
  fontSize: 18,
  fontWeight: "700",
},

panelClose: {
  fontSize: 22,
  fontWeight: "bold",
},

panelItem: {
  paddingVertical: 12,
  fontSize: 16,
  borderBottomWidth: 1,
  borderColor: "#ddd",
},

});