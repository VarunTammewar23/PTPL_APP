// src/screens/MainScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
  ToastAndroid,
} from 'react-native';

import RecipeTable from '../components/RecipeTable';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';
import { FileSystem } from "react-native-file-access";
import FileViewer from 'react-native-file-viewer';
import XLSX from 'xlsx';
import { API_BASE } from "@env";

// --- Props Type ---
interface MainScreenProps {
  customerCode: string;
  onLogout?: () => void;
}

// --- Recipe types ---
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
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [loadingParams, setLoadingParams] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Fetch recipe list
  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const res = await apiGet('/recipes', {
        params: { customer_code: customerCode },
        timeout: 7000,
      });

      setRecipes(res.data.recipes || []);
    } catch (err: any) {
      Alert.alert("Error fetching recipes", err?.message || "Network error");
    } finally {
      setLoadingRecipes(false);
    }
  }, [customerCode]);

  // Fetch recipe parameters
  const fetchRecipeParams = useCallback(async (id: number) => {
    setLoadingParams(true);
    try {
      const res = await apiGet(`/recipes/${id}`, { timeout: 10000 });
      setRecipeParams(res.data.params || []);
    } catch (err: any) {
      Alert.alert("Error fetching recipe parameters", err?.message);
    } finally {
      setLoadingParams(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (selectedRecipeId !== -1) fetchRecipeParams(selectedRecipeId);
    else setRecipeParams([]);
  }, [selectedRecipeId, fetchRecipeParams]);

  // Download Excel
  const downloadRecipeExcel = async () => {
    if (selectedRecipeId === -1) {
      Alert.alert("Select recipe first");
      return;
    }

    try {
      const url = `${API_BASE}/recipes/${selectedRecipeId}/download`;

      const filePath = `${FileSystem.dirs.DownloadDir}/recipe_${selectedRecipeId}.xlsx`;

      await FileSystem.downloadFile({
        fromUrl: url,
        toFile: filePath,
      });

      ToastAndroid.show("Saved to Downloads!", ToastAndroid.LONG);

      await FileViewer.open(filePath);
    } catch (err: any) {
      Alert.alert("Error downloading", err?.message || "Download failed");
    }
  };

  // Excel row mapper
  const mapExcelRow = (row: any) => ({
    parameter_no: row["Parameter No"] || row["Parameter"] || 0,
    section: row["Section"] || "",
    parameter: row["Parameter"] || "",
    value_01: row["Value"] || 0,
    unit: row["Unit"] || "",
  });

  // Import Excel
  const importRecipeExcel = async () => {
    try {
      const uri = await FileSystem.openDocument({
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const base64 = await FileSystem.readFile(uri);

      const workbook = XLSX.read(base64, { type: "base64" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const mapped = json.map(mapExcelRow);

      setRecipeParams(mapped);
      await uploadImportedRecipe(mapped);

      Alert.alert("Imported!", "Excel imported successfully.");
    } catch (err: any) {
      if (err?.message?.toLowerCase()?.includes("cancel")) return;
      Alert.alert("Import failed", err?.message || "Unknown error");
    }
  };

  // Upload to backend
  const uploadImportedRecipe = async (jsonData: any[]) => {
    try {
      const response = await fetch(`${API_BASE}/recipes/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_code: customerCode,
          recipe_data: jsonData,
        }),
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.message);

      Alert.alert("Uploaded!", "Recipe saved to database.");
    } catch (err: any) {
      Alert.alert("Upload failed", err.message);
    }
  };

  // Dropdown UI
  const openDropdown = () => {
    if (recipes.length === 0) {
      Alert.alert("No recipes available");
      return;
    }
    setDropdownVisible(true);
  };

  const selectedRecipeName =
    selectedRecipeId !== -1
      ? recipes.find((r) => r.recipe_id === selectedRecipeId)?.recipe_name
      : null;

  const openMachineView = () => {
    if (selectedRecipeId === -1) {
      Alert.alert("Select a recipe first");
      return;
    }

    navigation.navigate("Machine", {
      recipeId: selectedRecipeId,
      recipeName: selectedRecipeName,
    });
  };

  const renderDropdownItem = ({ item }: { item: Recipe }) => {
    const isSelected = item.recipe_id === selectedRecipeId;

    return (
      <Pressable
        onPress={() => {
          setSelectedRecipeId(item.recipe_id);
          setDropdownVisible(false);
        }}
        style={[
          styles.dropdownItem,
          isSelected && styles.dropdownItemSelected,
        ]}
      >
        <Text style={isSelected && styles.dropdownItemTextSelected}>
          {item.recipe_name}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, isDark ? styles.darkBg : styles.lightBg]}>
      <View style={styles.headerRow}>
        <Text style={[styles.loggedText, isDark ? styles.textLight : styles.textDark]}>
          Logged as: {customerCode}
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        {loadingRecipes ? (
          <ActivityIndicator />
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                  backgroundColor: selectedRecipeId === -1 ? "#aaa" : "#007bff",
                  paddingVertical: 14,
                  paddingHorizontal: 10,
                  borderRadius: 6,
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>⬇</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={importRecipeExcel}
                style={{
                  backgroundColor: "#28a745",
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>⬆</Text>
              </TouchableOpacity>
            </View>

            <Modal visible={dropdownVisible} transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
                <View style={[styles.modalContent, isDark ? styles.darkCard : styles.lightCard]}>
                  <Text style={styles.modalTitle}>Select recipe</Text>
                  <FlatList
                    data={recipes}
                    renderItem={renderDropdownItem}
                    keyExtractor={(it) => String(it.recipe_id)}
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
            <Text style={isDark ? styles.textLight : styles.textDark}>
              No parameters for this recipe.
            </Text>
          ) : (
            <RecipeTable data={recipeParams} darkMode={isDark} />
          )
        ) : (
          <Text style={[styles.textDark, { opacity: 0.6 }]}>
            Select a recipe to view parameters.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safe: { flex: 1, padding: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  loggedText: { fontSize: 16 },
  dropdownBox: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { fontSize: 16 },
  chevron: { fontSize: 18 },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemSelected: { backgroundColor: "#e8f0ff" },
  dropdownItemTextSelected: { fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    maxHeight: "70%",
    padding: 10,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  lightBg: { backgroundColor: "#fff" },
  darkBg: { backgroundColor: "#111" },
  darkCard: { backgroundColor: "#222" },
  lightCard: { backgroundColor: "#fff" },
  textLight: { color: "#fff" },
  textDark: { color: "#000" },
});
