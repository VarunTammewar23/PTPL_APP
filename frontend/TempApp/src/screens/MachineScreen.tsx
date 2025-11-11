// src/screens/MachineScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiGet } from '../api/api';
import { useTheme } from '../theme/ThemeProvider';

type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  Machine: { recipeId: number; recipeName?: string; imageUri?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Machine'>;

interface RecipeParam {
  parameter_no: number;
  section?: string;
  parameter: string;
  value_01: number | string;
  unit?: string;
}

const DEFAULT_POSITIONS = [
  { x: 8, y: 12 },
  { x: 70, y: 10 },
  { x: 10, y: 55 },
  { x: 55, y: 50 },
  { x: 75, y: 70 },
];

const POLL_MS = 2000;

export default function MachineScreen({ route }: Props) {
  const { recipeId, recipeName, imageUri } = route.params;
  const [loading, setLoading] = useState<boolean>(true);
  const [params, setParams] = useState<RecipeParam[]>([]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const window = Dimensions.get('window');
  const imageWidth = window.width - 24;
  const imageHeight = Math.round((imageWidth * 9) / 16);

  const imageSource = imageUri ? { uri: imageUri } : require('../assets/machine-placeholder.jpg');

  const fetchParams = async () => {
    try {
      const res = await apiGet(`/recipes/${recipeId}`, { timeout: 8000 });
      const p: RecipeParam[] = res.data?.params ?? [];
      setParams(p);
    } catch (err: any) {
      console.warn('MachineScreen fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      await fetchParams();
      const id = setInterval(() => {
        if (!alive) return;
        fetchParams();
      }, POLL_MS);
      return () => {
        alive = false;
        clearInterval(id);
      };
    })();
  }, [recipeId]);

  const displayedParams = useMemo(() => {
    if (!params || params.length === 0) return [];
    const sorted = [...params].sort((a, b) => (a.parameter_no ?? 0) - (b.parameter_no ?? 0));
    return sorted.slice(0, 5);
  }, [params]);

  const overlays = DEFAULT_POSITIONS.map((pos, idx) => ({ pos, param: displayedParams[idx] ?? null }));

  const onOverlayPress = (param: RecipeParam | null) => {
    if (!param) return;
    Alert.alert(param.parameter, `Value: ${param.value_01} ${param.unit ?? ''}`);
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isDark ? styles.textLight : styles.textDark]}>
            {recipeName ? `${recipeName}` : `Recipe ${recipeId}`}
          </Text>
          <Text style={[styles.subtitle, isDark ? styles.textLight : styles.textDark]}>
            (Tap overlays for details)
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <ImageBackground
            source={imageSource}
            style={[styles.image, { width: imageWidth, height: imageHeight }]}
            resizeMode="contain"
          >
            {overlays.map((o, i) => {
              const left = `${o.pos.x}%`;
              const top = `${o.pos.y}%`;
              const param = o.param;
              return (
                <TouchableOpacity
                  key={`ov-${i}`}
                  onPress={() => onOverlayPress(param)}
                  activeOpacity={param ? 0.7 : 1}
                  style={[
                    styles.overlay,
                    {
                      left,
                      top,
                      backgroundColor: param ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.12)',
                    },
                  ]}
                >
                  {param ? (
                    <>
                      <Text style={[styles.overlayTitle, styles.overlayText]}>{param.parameter}</Text>
                      <Text style={[styles.overlayValue, styles.overlayText]}>
                        {String(param.value_01)} {param.unit ?? ''}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.overlayText, { fontStyle: 'italic', fontSize: 12 }]}>—</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ImageBackground>
        </View>

        <View style={{ height: 18 }} />

        <View style={styles.infoBox}>
          <Text style={isDark ? styles.textLight : styles.textDark}>Showing {displayedParams.length} parameter(s)</Text>
          <Text style={[{ marginTop: 8 }, isDark ? styles.textLight : styles.textDark]}>
            Values update automatically from the server.
          </Text>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 12, color: '#666' },
  image: { justifyContent: 'flex-start' },
  overlay: {
    position: 'absolute',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    minWidth: 80,
    maxWidth: 160,
    transform: [{ translateX: -40 }, { translateY: -12 }],
  },
  overlayText: { color: '#fff', textAlign: 'center' },
  overlayTitle: { fontSize: 11, opacity: 0.9 },
  overlayValue: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  infoBox: { padding: 12 },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  darkBg: { backgroundColor: '#0b0b0b' },
  lightBg: { backgroundColor: '#fff' },
  textLight: { color: '#fff' },
  textDark: { color: '#000' },
});
