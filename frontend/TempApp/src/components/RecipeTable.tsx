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

  const colBorder = { borderRightWidth: 1, borderColor };

  return (
    <View style={{ flex: 1, paddingHorizontal: 10 }}>
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
            flex: 1,
            textAlign: 'center',
            fontWeight: '600',
            color: textColor,
            paddingVertical: 8,
            ...colBorder,
          }}
        >
          Sr No.
        </Text>

        <Text
          style={{
            flex: 3,
            textAlign: 'center',
            fontWeight: '600',
            color: textColor,
            paddingVertical: 8,
            ...colBorder,
          }}
        >
          Parameter
        </Text>

        <Text
          style={{
            width: 80,
            textAlign: 'center',
            fontWeight: '600',
            color: textColor,
            paddingVertical: 8,
            ...colBorder,
          }}
        >
          Value
        </Text>

        <Text
          style={{
            width: 60,
            textAlign: 'center',
            fontWeight: '600',
            color: textColor,
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
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                color: textColor,
                paddingVertical: 10,
                ...colBorder,
              }}
            >
              {item.parameter_no}
            </Text>

            <Text
              style={{
                flex: 3,
                textAlign: 'center',
                color: textColor,
                paddingVertical: 10,
                ...colBorder,
              }}
            >
              {item.parameter}
            </Text>

            <Text
              style={{
                width: 80,
                textAlign: 'center',
                color: textColor,
                paddingVertical: 10,
                ...colBorder,
              }}
            >
              {item.value_01}
            </Text>

            <Text
              style={{
                width: 60,
                textAlign: 'center',
                color: textColor,
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
