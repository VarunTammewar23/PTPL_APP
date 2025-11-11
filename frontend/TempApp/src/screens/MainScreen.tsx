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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import RecipeTable from '../components/RecipeTable';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api'; // <-- use wrapper that reads current API base

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

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [recipeParams, setRecipeParams] = useState<RecipeParam[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState<boolean>(true);
  const [loadingParams, setLoadingParams] = useState<boolean>(false);

  // useCallback ensures stable function identity so useEffect deps are safe
  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const res = await apiGet('/recipes', {
        params: { customer_code: customerCode },
        timeout: 7000,
      });
      setRecipes(res.data.recipes || []);
    } catch (err: any) {
      console.warn('fetchRecipes error', err);
      Alert.alert('Error fetching recipes', err?.message || 'Network error');
    } finally {
      setLoadingRecipes(false);
    }
  }, [customerCode]);

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
    if (selectedRecipeId) fetchRecipeParams(selectedRecipeId);
    else setRecipeParams([]);
  }, [selectedRecipeId, fetchRecipeParams]);

  // Helper to open Machine screen
  const openMachineView = () => {
    if (!selectedRecipeId) {
      Alert.alert('Select a recipe first');
      return;
    }
    const recipeName = recipes.find((r) => r.recipe_id === selectedRecipeId)?.recipe_name;
    navigation.navigate('Machine', {
      recipeId: selectedRecipeId,
      recipeName: recipeName,
      // imageUri: optional - pass here if you have a per-recipe image URL
    });
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
        <Text style={[{ marginBottom: 6 }, isDark ? styles.textLight : styles.textDark]}>Select recipe</Text>
        {loadingRecipes ? (
          <ActivityIndicator />
        ) : (
          <View
            style={[
              {
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 6,
              },
              isDark ? styles.darkCard : styles.lightCard,
            ]}
          >
            <Picker
              selectedValue={selectedRecipeId}
              onValueChange={(val) => {
                if (val === null || val === undefined) setSelectedRecipeId(null);
                else setSelectedRecipeId(Number(val));
              }}
            >
              <Picker.Item label="-- select recipe --" value={null} />
              {recipes.map((r) => (
                <Picker.Item key={r.recipe_id} label={r.recipe_name} value={r.recipe_id} />
              ))}
            </Picker>
          </View>
        )}

        {/* Open Machine View button (visible when a recipe is selected) */}
        {selectedRecipeId ? (
          <View style={{ marginTop: 10 }}>
            <Button title="Open Machine View" onPress={openMachineView} />
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        {loadingParams ? (
          <ActivityIndicator />
        ) : selectedRecipeId ? (
          recipeParams.length === 0 ? (
            <Text style={isDark ? styles.textLight : styles.textDark}>No parameters for this recipe.</Text>
          ) : (
            <RecipeTable data={recipeParams} darkMode={isDark} />
          )
        ) : (
          <Text style={[{ color: '#666' }, isDark ? styles.textLight : styles.textDark]}>Select a recipe to view its parameters.</Text>
        )}
      </View>
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
  lightBg: { backgroundColor: '#fff' },
  darkBg: { backgroundColor: '#111' },
  lightCard: { backgroundColor: '#fff' },
  darkCard: { backgroundColor: '#222' },
  textLight: { color: '#fff' },
  textDark: { color: '#000' },
});
