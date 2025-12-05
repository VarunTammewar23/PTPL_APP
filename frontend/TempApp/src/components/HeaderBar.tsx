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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

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
          <Image
            source={require('../assets/company_logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Recipe Select Dropdown */}
          <TouchableOpacity style={styles.dropdownTrigger} onPress={openDropdown}>
            <Text style={[styles.dropdownText]}>
              {selectedRecipeName ?? 'Select recipe'} ▾
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Recipe No:</Text>
          <Text style={styles.inputBox}>
            {recipeId !== -1 ? recipeId : '--'}
          </Text>

          <Text style={[styles.label]}>Recipe Name:</Text>
          <Text style={[styles.inputBox, { minWidth: 140 }]}>
            {recipeName ?? '--'}
          </Text>

          {/* Right Side Buttons */}
          <View style={styles.rightButtons}>
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
  height: 65,       // set a fixed header height (you can change this)
  elevation: 5,
},

  content: {
  flex: 1,
  paddingHorizontal: 12,
},


  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'nowrap',
  },

  logo: {
  height: '100%',
  width: undefined,
  aspectRatio: 72 / 48, // keeps the same ratio
  resizeMode: 'contain',
  marginRight: 10,
},


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
  fontWeight: '700',
  fontSize: 20,
  textAlign: 'center',
  includeFontPadding: false,
},


  label: { fontSize: 20, fontWeight: '500', color: '#000', marginLeft: 6, marginRight: 8 },


  inputBox: {
  backgroundColor: '#fff',
  height: FIELD_HEIGHT,
  minWidth: FIELD_MIN_WIDTH,
  paddingHorizontal: 10,
  borderRadius: 6,
  fontSize: 20,
  fontWeight: 500,
  textAlign: 'center',
  color: '#000',
  justifyContent: 'center',
  textAlignVertical: 'center',
  marginLeft: 6,
  marginRight: 8
},


  /* RIGHT BUTTONS */
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },

  commonBtn: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6, 
    marginRight: 8
  },

  btnText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 24,
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
  modalTitle: { paddingVertical: 10, paddingHorizontal: 8, fontSize: 16, fontWeight: '600' },

  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownItemSelected: { backgroundColor: '#e6f0ff' },
  dropdownItemText: { fontSize: 15 },
  dropdownItemTextSelected: { fontWeight: '700' },
});