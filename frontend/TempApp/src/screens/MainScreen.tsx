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
  NativeModules
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
import HeaderBar from '../components/HeaderBar';

const { FilePickerModule } = NativeModules;

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

  const openPanel = (name: string) => {
    setActivePanel(name);
    Animated.timing(panelAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  const closePanel = () => {
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

      {/* MACHINE BOTTOM NAV */}
      <View style={styles.bottomNav}>
        {["RPF", "RT Angle", "Knife 1", "Knife 2", "Tray"].map(label => (
          <TouchableOpacity key={label} onPress={() => openPanel(label)} style={styles.navButton}>
            <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SLIDE PANEL */}
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

        {activePanel === "RT Angle" && (
          <>
            <Text style={styles.panelItem}>Rotate Left</Text>
            <Text style={styles.panelItem}>Rotate Right</Text>
            <Text style={styles.panelItem}>Reset Angle</Text>
          </>
        )}

        {activePanel === "Knife 1" && (
          <>
            <Text style={styles.panelItem}>Knife 1 Width</Text>
            <Text style={styles.panelItem}>Knife 1 Speed</Text>
          </>
        )}

        {activePanel === "Knife 2" && (
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
  safe: { flex: 1, padding: 12 },
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

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1f1f1f",
    paddingVertical: 17,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: "#444",
  },

  navButton: { paddingHorizontal: 13, paddingVertical: 13, backgroundColor: "#007bff", borderRadius: 6 },

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
