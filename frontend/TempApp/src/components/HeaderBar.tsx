// src/components/HeaderBar.tsx
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
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '../theme/typography';  // 👈 NEW

interface Recipe {
  recipe_id: number;
  recipe_name: string;
}

interface Props {
  recipeId: number;
  recipeName: string | null;
  onUpload: () => void;

  recipes?: Recipe[];
  selectedRecipeId?: number;
  selectedRecipeName?: string | null;
  onSelectRecipe?: (id: number) => void;
  onDownload?: () => void;
  screenTitle?: string;
}

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
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const openDropdown = () => {
    if (!recipes || recipes.length === 0) {
      return alert('No recipes available');
    }
    setDropdownVisible(true);
  };

  const handleSelect = (id: number) => {
    setDropdownVisible(false);
    onSelectRecipe && onSelectRecipe(id);
  };

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

        {/* ================= TOP ROW ================= */}
        <View style={styles.row1}>

          {/* LEFT GROUP */}
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

            {screenTitle && (
            <View style={styles.screenBox}>
                  <Text style={styles.screenText}>{screenTitle}</Text>
              </View>
            )}
          </View>

          {/* RIGHT GROUP */}
          <View style={styles.rightGroup}>
            <TouchableOpacity style={[styles.commonBtn, styles.uploadBtn]} onPress={onUpload}>
              <Text style={styles.btnText}>Upload</Text>
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
              <Text style={styles.btnText}>Download</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* ================= MODAL ================= */}
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
============================================================ */

const BUTTON_WIDTH = 150;
const BUTTON_HEIGHT = 45;
const FIELD_HEIGHT = 45;
const FIELD_MIN_WIDTH = 150;

const styles = StyleSheet.create({
wrapper: {
  width: '100%',
  backgroundColor: '#d6e4f0',
  height: 65,
  elevation: 5,
  paddingHorizontal: 0,  // remove all side padding
},

content: {
  flex: 1,
  paddingRight: 0,       // remove right padding
},

  /* MAIN LAYOUT */
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

leftGroup: {
  flexDirection: 'row',
  alignItems: 'center',
  flexShrink: 1,
  marginLeft: 0,          // ensure start from left edge
},

  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

logo: {
  height: '100%',
  width: undefined,
  aspectRatio: 72 / 48,
  resizeMode: 'contain',
  marginRight: 8,          // keep small spacing only after logo
},

  /* RECIPE FIELDS */
  dropdownTrigger: {
    backgroundColor: '#fff',
    height: FIELD_HEIGHT,
    minWidth: FIELD_MIN_WIDTH,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    marginRight: 8,
  },

  dropdownText: {
    color: '#000',
    fontFamily: FONT_FAMILY.regular,     // 👈 uses typography
    fontSize: FONT_SIZE.label,
    fontWeight: FONT_WEIGHT.bold,       // 👈 uses typography
    textAlign: 'center',
    includeFontPadding: false,
  },

  label: {
    fontFamily: FONT_FAMILY.medium,   // 👈 label style
    fontSize: FONT_SIZE.special,
    fontWeight: FONT_WEIGHT.regular,
    color: '#000',
    marginLeft: 6,
    marginRight: 8,
  },

  inputBox: {
    backgroundColor: '#fff',
    height: FIELD_HEIGHT,
    minWidth: FIELD_MIN_WIDTH,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontFamily: FONT_FAMILY.medium,   // 👈 same as label
    fontSize: FONT_SIZE.header,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    color: '#000',
    justifyContent: 'center',
    textAlignVertical: 'center',
    marginLeft: 6,
    marginRight: 8,
  },

  /* RIGHT BUTTONS */
  commonBtn: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    marginRight: 8,
  },

  btnText: {
    color: '#fff',
    fontFamily: FONT_FAMILY.bold,     // 👈 buttons use bold
    fontSize: FONT_SIZE.label,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },

  uploadBtn: { backgroundColor: '#008a3e' },
  downloadBtn: { backgroundColor: '#007bff' },
  downloadDisabled: { backgroundColor: '#999' },

  /* MODAL */
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
    backgroundColor: '#fff',
  },

  modalTitle: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontFamily: FONT_FAMILY.bold,     // 👈 title style
    fontSize: FONT_SIZE.label,
    fontWeight: FONT_WEIGHT.bold,
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  dropdownItemSelected: {
    backgroundColor: '#bad2f7ff',
  },

  dropdownItemText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: FONT_SIZE.label,
  },

  dropdownItemTextSelected: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: FONT_SIZE.label,
    fontWeight: FONT_WEIGHT.bold,

  },

      screenBox: {
      backgroundColor: '#0047ba',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 2,
    },
    screenText: {
      color: '#fff',
      fontFamily: FONT_FAMILY.bold,
      fontSize: FONT_SIZE.header,
      fontWeight: FONT_WEIGHT.bold,
    },

});
