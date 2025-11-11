// src/components/RecipeTable.tsx
import React from 'react';
import { View, Text, FlatList } from 'react-native';

// --- Define the shape of one recipe parameter ---
interface RecipeParam {
  row_id?: number;
  recipe_name?: string;
  parameter_no: number;
  section?: string;
  parameter: string;
  value_01: number;
  unit?: string;
}

// --- Props type for the component ---
interface RecipeTableProps {
  data: RecipeParam[];
  darkMode?: boolean; // optional prop to switch styling
}

// --- Component ---
export default function RecipeTable({ data, darkMode = false }: RecipeTableProps) {
  const headerBg = darkMode ? '#222' : '#f8f8f8';
  const rowBg = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#fff' : '#000';
  const borderColor = darkMode ? '#333' : '#ddd';

  return (
    <View style={{ flex: 1 }}>
      {/* Table header */}
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderColor,
          backgroundColor: headerBg,
        }}
      >
        <Text style={{ flex: 1, fontWeight: '600', color: textColor }}>No</Text>
        <Text style={{ flex: 3, fontWeight: '600', color: textColor }}>Parameter</Text>
        <Text style={{ width: 80, textAlign: 'right', fontWeight: '600', color: textColor }}>Value</Text>
        <Text style={{ width: 60, textAlign: 'right', fontWeight: '600', color: textColor }}>Unit</Text>
      </View>

      {/* Table data */}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.row_id ?? item.parameter_no)}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              paddingVertical: 10,
              borderBottomWidth: 0.5,
              borderColor,
              backgroundColor: rowBg,
            }}
          >
            <Text style={{ flex: 1, color: textColor }}>{item.parameter_no}</Text>
            <Text style={{ flex: 3, color: textColor }}>{item.parameter}</Text>
            <Text style={{ width: 80, textAlign: 'right', color: textColor }}>{item.value_01}</Text>
            <Text style={{ width: 60, textAlign: 'right', color: textColor }}>{item.unit || ''}</Text>
          </View>
        )}
      />
    </View>
  );
}
