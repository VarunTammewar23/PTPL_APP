// src/components/RecipeTable.tsx
import React from 'react';
import { View, Text, FlatList } from 'react-native';

interface RecipeParam {
  row_id?: number;
  recipe_name?: string;
  parameter_no: number;
  section?: string;
  parameter: string;
  value_01: number;
  unit?: string;
}

interface RecipeTableProps {
  data: RecipeParam[];
  darkMode?: boolean;
}

export default function RecipeTable({ data, darkMode = false }: RecipeTableProps) {
  const headerBg = darkMode ? '#222' : '#f8f8f8';
  const rowBg = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#fff' : '#000';
  const borderColor = darkMode ? '#333' : '#ccc';
   // ⬇️ ADD THIS HERE
  const FONT_SIZE = 20;
  const FONT_WEIGHT = 700;  // 🔥 global font size
  const baseText = { fontSize: FONT_SIZE, color: textColor };

  const colBorder = { borderRightWidth: 1, borderColor };

  return (
    <View style={{ flex: 1, paddingHorizontal: 10 }}>
      {/* Table header */}
      {/* Table header */}
      <View
        style={{
          flexDirection: 'row',
          borderWidth: 1,
          borderColor,
          backgroundColor: headerBg,
        }}
      >
        <Text
          style={{
            width: 80,
            textAlign: 'center',
            fontWeight: '1000',
            ...baseText,
            paddingVertical: 8,
            ...colBorder,
          }}
        >
          Sr No.
        </Text>

        <Text
          style={{
            flex: 2,
            textAlign: 'center',
            fontWeight: '1000',
            ...baseText,
            paddingVertical: 8,
            ...colBorder,
          }}
        >
          Section
        </Text>

        <Text
          style={{
            flex: 3,
            textAlign: 'left',
            fontWeight: '1000',
            ...baseText,
            paddingVertical: 8,
            paddingLeft: 5,
            ...colBorder,
          }}
        >
          Parameter
        </Text>

  <Text
    style={{
      width: 200,
      textAlign: 'center',
      fontWeight: '1000',
      ...baseText,
      paddingVertical: 8,
      ...colBorder,
    }}
  >
    Value
  </Text>

  <Text
    style={{
      width: 90,
      textAlign: 'center',
      fontWeight: '1000',
      ...baseText,
      paddingVertical: 8,
    }}
  >
    Unit
  </Text>
</View>


      {/* Table data */}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.row_id ?? item.parameter_no)}
    renderItem={({ item }) => (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: rowBg,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderColor,
        }}
      >
        {/* Sr No */}
        <Text
          style={{
            width: 80,
            textAlign: 'center',
            ...baseText,
            paddingVertical: 10,
            ...colBorder,
          }}
        >
          {item.parameter_no}
        </Text>

        {/* Section Column */}
        <Text
          style={{
            flex: 2,
            textAlign: 'center',
            ...baseText,
            paddingVertical: 10,
            ...colBorder,
          }}
        >
          {item.section ?? ''}
        </Text>

        {/* Parameter */}
        <Text
          style={{
            flex: 3,
            textAlign: 'left',
            ...baseText,
            paddingLeft:5,
            paddingVertical: 10,
            ...colBorder,
          }}
        >
          {item.parameter}
        </Text>

        {/* Value */}
        <Text
          style={{
            width: 200,
            textAlign: 'center',
            ...baseText,
            paddingVertical: 10,
            ...colBorder,
          }}
        >
          {item.value_01}
        </Text>

        {/* Unit */}
        <Text
          style={{
            width: 90,
            textAlign: 'center',
            ...baseText,
            paddingVertical: 10,
          }}
        >
          {item.unit || ''}
        </Text>
      </View>
    )}

      />
    </View>
  );
}