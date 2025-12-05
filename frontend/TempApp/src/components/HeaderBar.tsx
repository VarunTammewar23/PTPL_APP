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
        {/* ROW 1 */}
        <View style={styles.row1}>
          <Image
            source={require('../assets/company_logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity style={styles.dropdownTrigger} onPress={openDropdown}>
            <Text style={[styles.btnText, { color: '#000' }]}>
              {selectedRecipeName ?? 'Select recipe'} ▾
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Recipe No:</Text>
          <Text style={styles.inputBox}>
            {recipeId !== -1 ? recipeId : '--'}
          </Text>

          <Text style={[styles.label, { marginLeft: 10 }]}>Recipe Name:</Text>
          <Text style={[styles.inputBox, { minWidth: 170 }]}>
            {recipeName ?? '--'}
          </Text>

          {/* Upload + Download + Settings */}
          <View style={styles.rightButtons}>
            <TouchableOpacity style={styles.uploadBtn} onPress={onUpload}>
              <Text style={styles.btnText}>Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadBtn, selectedRecipeId === -1 && styles.downloadDisabled]}
              onPress={() => onDownload && onDownload()}
              disabled={selectedRecipeId === -1}
            >
              <Text style={styles.btnText}>Download ⬇</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Icon name="settings" size={26} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={dropdownVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
          <View style={[styles.modalContent]}>
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

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: '#d6e4f0',
    paddingVertical: 10,
    elevation: 5,
  },
  content: { paddingHorizontal: 12 },

  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'nowrap',
  },
  logo: { width: 72, height: 48, marginRight: 10 },

  label: { fontSize: 16, fontWeight: '700', color: '#000' },

  inputBox: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 25,
    borderRadius: 4,
    marginHorizontal: 6,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
  },

  rightButtons: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  uploadBtn: { backgroundColor: '#008a3e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  downloadBtn: { backgroundColor: '#007bff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  downloadDisabled: { backgroundColor: '#999' },

  dropdownTrigger: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },

  btnText: { color: '#fff', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalContent: { maxHeight: '70%', borderRadius: 8, padding: 8, backgroundColor: '#fff' },
  modalTitle: { paddingVertical: 10, paddingHorizontal: 8, fontSize: 16, fontWeight: '600' },

  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownItemSelected: { backgroundColor: '#e6f0ff' },
  dropdownItemText: { fontSize: 15 },
  dropdownItemTextSelected: { fontWeight: '700' },
});
