// src/components/HeaderBar.tsx
// ============================================================
// HeaderBar Component
// ------------------------------------------------------------
// Purpose:
// - Renders the top header bar of the application
// - Shows company logo
// - Allows recipe selection via dropdown modal
// - Displays selected recipe number
// - Provides Import (upload) and Export (download) actions
// - Optionally displays a screen title badge
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '../theme/typography';  // Typography constants

/* ============================================================
   DATA TYPES
============================================================ */

// Represents a single recipe entry shown in the dropdown
interface Recipe {
  recipe_id: number;
  recipe_name: string;
}

// Props accepted by the HeaderBar component
interface Props {
  recipeId: number;                 // Currently selected recipe number
  recipeName: string | null;        // Recipe name (if available)
  onUpload: () => void;             // Handler for Import button

  recipes?: Recipe[];               // List of recipes for dropdown
  selectedRecipeId?: number;        // Currently selected recipe ID
  selectedRecipeName?: string | null; // Currently selected recipe name
  onSelectRecipe?: (id: number) => void; // Callback when recipe is selected
  onDownload?: () => void;           // Handler for Export button
  screenTitle?: string;              // Optional screen title badge
}

/* ============================================================
   COMPONENT DEFINITION
============================================================ */

export default function HeaderBar({
  recipeId,
  recipeName,
  onUpload,
  recipes = [],
  selectedRecipeId = -1,
  selectedRecipeName = null,
  onSelectRecipe,
  onDownload,
  screenTitle,
}: Props) {
  const navigation = useNavigation<any>();

  // Controls visibility of the recipe dropdown modal
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Opens dropdown only if recipes are available
  const openDropdown = () => {
    if (!recipes || recipes.length === 0) {
      return alert('No recipes available');
    }
    setDropdownVisible(true);
  };

  // Handles recipe selection from dropdown
  const handleSelect = (id: number) => {
    setDropdownVisible(false);
    onSelectRecipe && onSelectRecipe(id);
  };

  // Renders a single recipe item inside the dropdown list
  const renderDropdownItem = ({ item }: { item: Recipe }) => {
    const isSelected = item.recipe_id === selectedRecipeId;
    return (
      <Pressable
        onPress={() => handleSelect(item.recipe_id)}
        style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
      >
        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
          {item.recipe_name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>

        {/* ================= TOP ROW =================
            Main horizontal layout of the header
        */}
        <View style={styles.row1}>

          {/* LEFT GROUP
              Contains:
              - Company logo
              - Recipe selector dropdown
              - Recipe number display
              - Optional screen title badge
          */}
          <View style={styles.leftGroup}>
            <Image
              source={require('../assets/company_logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.label}>Select recipe:</Text>

            <TouchableOpacity style={styles.dropdownTrigger} onPress={openDropdown}>
              <Text style={styles.dropdownText}>
                {selectedRecipeName ?? 'Select recipe'} ▾
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Recipe No:</Text>
            <Text style={styles.inputBox}>
              {recipeId !== -1 ? recipeId : '--'}
            </Text>

            {/* Screen title badge (shown only if provided) */}
            {screenTitle && (
            <View style={styles.screenBox}>
                  <Text style={styles.screenText}>{screenTitle}</Text>
              </View>
            )}
          </View>

          {/* RIGHT GROUP
              Contains:
              - Import button
              - Export button
          */}
          <View style={styles.rightGroup}>
            <TouchableOpacity style={[styles.commonBtn, styles.uploadBtn]} onPress={onUpload}>
              <Text style={styles.btnText}>Import</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.commonBtn,
                styles.downloadBtn,
                selectedRecipeId === -1 && styles.downloadDisabled,
              ]}
              onPress={() => onDownload && onDownload()}
              disabled={selectedRecipeId === -1}
            >
              <Text style={styles.btnText}>Export</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* ================= MODAL =================
          Recipe selection dropdown modal
      */}
      <Modal
        visible={dropdownVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select recipe</Text>
            <FlatList
              data={recipes}
              keyExtractor={(i) => String(i.recipe_id)}
              renderItem={renderDropdownItem}
              style={{ maxHeight: '70%' }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ============================================================
   STYLES
   Each section below corresponds to a specific UI element
============================================================ */

const BUTTON_WIDTH = 120;
const BUTTON_HEIGHT = 45;
const FIELD_HEIGHT = 45;
const FIELD_MIN_WIDTH = 150;

const styles = StyleSheet.create({
/* ---------- HEADER CONTAINER (entire top bar) ---------- */
wrapper: {
  width: '100%',
  backgroundColor: '#d6e4f0',
  height: 65,
  elevation: 5,
  paddingHorizontal: 0,
},

/* ---------- INNER CONTENT WRAPPER ---------- */
content: {
  flex: 1,
  paddingRight: 0,
},

/* ---------- MAIN ROW LAYOUT ---------- */
row1: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
},

/* ---------- LEFT SECTION (logo + recipe info) ---------- */
leftGroup: {
  flexDirection: 'row',
  alignItems: 'center',
  flexShrink: 1,
  marginLeft: 0,
},

/* ---------- RIGHT SECTION (buttons) ---------- */
rightGroup: {
  flexDirection: 'row',
  alignItems: 'center',
},

/* ---------- COMPANY LOGO ---------- */
logo: {
  height: '100%',
  width: undefined,
  aspectRatio: 72 / 48,
  resizeMode: 'contain',
  marginRight: 8,
},

/* ---------- RECIPE DROPDOWN FIELD ---------- */
dropdownTrigger: {
  backgroundColor: '#fff',
  height: FIELD_HEIGHT,
  minWidth: FIELD_MIN_WIDTH,
  paddingHorizontal: 10,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: '#ddd',
  justifyContent: 'center',
  marginRight: 20,
},

dropdownText: {
  color: '#000',
  fontFamily: FONT_FAMILY.regular,
  fontSize: FONT_SIZE.text,
  fontWeight: FONT_WEIGHT.bold,
  textAlign: 'center',
  includeFontPadding: false,
},

/* ---------- LABEL TEXT (e.g., Select recipe, Recipe No) ---------- */
label: {
  fontFamily: FONT_FAMILY.medium,
  fontSize: FONT_SIZE.special,
  fontWeight: FONT_WEIGHT.regular,
  color: '#000',
  marginLeft: 10,
  marginRight: 20,
},

/* ---------- RECIPE NUMBER DISPLAY FIELD ---------- */
inputBox: {
  backgroundColor: '#fff',
  height: FIELD_HEIGHT,
  minWidth: FIELD_MIN_WIDTH,
  paddingHorizontal: 10,
  borderRadius: 6,
  fontFamily: FONT_FAMILY.medium,
  fontSize: FONT_SIZE.special,
  fontWeight: FONT_WEIGHT.bold,
  textAlign: 'center',
  color: '#000',
  justifyContent: 'center',
  textAlignVertical: 'center',
  marginLeft: 0,
  marginRight: 20,
},

/* ---------- COMMON BUTTON BASE STYLE ---------- */
commonBtn: {
  width: BUTTON_WIDTH,
  height: BUTTON_HEIGHT,
  borderRadius: 6,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 6,
  marginRight: 8,
},

/* ---------- BUTTON TEXT ---------- */
btnText: {
  color: '#fff',
  fontFamily: FONT_FAMILY.bold,
  fontSize: FONT_SIZE.button,
  fontWeight: FONT_WEIGHT.bold,
  textAlign: 'center',
},

/* ---------- IMPORT BUTTON ---------- */
uploadBtn: { backgroundColor: '#008a3e' },

/* ---------- EXPORT BUTTON ---------- */
downloadBtn: { backgroundColor: '#007bff' },

/* ---------- DISABLED EXPORT STATE ---------- */
downloadDisabled: { backgroundColor: '#999' },

/* ---------- MODAL OVERLAY ---------- */
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  padding: 16,
},

/* ---------- MODAL CONTENT BOX ---------- */
modalContent: {
  maxHeight: '70%',
  borderRadius: 8,
  padding: 8,
  backgroundColor: '#fff',
},

/* ---------- MODAL TITLE ---------- */
modalTitle: {
  paddingVertical: 10,
  paddingHorizontal: 8,
  fontFamily: FONT_FAMILY.bold,
  fontSize: FONT_SIZE.label,
  fontWeight: FONT_WEIGHT.bold,
},

/* ---------- DROPDOWN LIST ITEM ---------- */
dropdownItem: {
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  marginRight: 20,
  marginleft: 20,
},

/* ---------- SELECTED DROPDOWN ITEM ---------- */
dropdownItemSelected: {
  backgroundColor: '#bad2f7ff',
},

/* ---------- DROPDOWN ITEM TEXT ---------- */
dropdownItemText: {
  fontFamily: FONT_FAMILY.regular,
  fontSize: FONT_SIZE.label,
},

/* ---------- SELECTED DROPDOWN ITEM TEXT ---------- */
dropdownItemTextSelected: {
  fontFamily: FONT_FAMILY.regular,
  fontSize: FONT_SIZE.label,
  fontWeight: FONT_WEIGHT.bold,
},

/* ---------- SCREEN TITLE BADGE ---------- */
screenBox: {
  backgroundColor: '#ffffffff',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
  marginLeft: 10,
  height: FIELD_HEIGHT,
  minWidth: FIELD_MIN_WIDTH,
  justifyContent: 'center',
  textAlignVertical: 'center',
  textAlign: 'center',
},

screenText: {
  color: '#000000ff',
  fontFamily: FONT_FAMILY.bold,
  fontSize: FONT_SIZE.text,
  fontWeight: FONT_WEIGHT.bold,
},

});
