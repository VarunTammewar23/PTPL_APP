// src/screens/MachineScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  Alert,
  Image,
  Platform,
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
  parameter: string;
  value_01: number | string;
  unit?: string;
}

/** Edit these percentage coords in code to reposition overlays (x = % from left, y = % from top) */
const POSITIONS_BY_SR: Record<number, { x: number; y: number }> = {
  1: { x: 20, y: 25 },
  2: { x: 70, y: 25 },
  3: { x: 20, y: 70 },
  4: { x: 70, y: 70 },
};

const SR_LIST = [ 1, 2 , 3, 4];
const POLL_MS = 2000;

export default function MachineScreen({ route }: Props) {
  const { recipeId, imageUri } = route.params;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState<boolean>(true);
  const [params, setParams] = useState<RecipeParam[]>([]);

  // natural image size (pixels)
  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  // container size (available screen)
  const [contW, setContW] = useState<number>(Dimensions.get('window').width);
  const [contH, setContH] = useState<number>(Dimensions.get('window').height);

  // derived displayed image size (calculated to mimic `contain`)
  const [dispW, setDispW] = useState<number>(contW);
  const [dispH, setDispH] = useState<number>(contH);

  // image source (uri or local asset)
  const imageSource = imageUri ? { uri: imageUri } : require('../assets/machine-placeholder.jpg');

  // fetch natural image size
  useEffect(() => {
    let mounted = true;

    const resolveLocal = (src: any) => {
      try {
        // get size for local require
        const resolved = Image.resolveAssetSource(src);
        if (mounted) {
          setNatW(resolved.width);
          setNatH(resolved.height);
        }
      } catch (e) {
        // fallback to container size
        if (mounted) {
          setNatW(contW);
          setNatH(contH);
        }
      }
    };

    if (imageUri) {
      Image.getSize(
        imageUri,
        (w, h) => {
          if (!mounted) return;
          setNatW(w);
          setNatH(h);
        },
        (err) => {
          // couldn't get remote size — fallback
          if (mounted) {
            setNatW(contW);
            setNatH(contH);
          }
        }
      );
    } else {
      resolveLocal(imageSource);
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUri]);

  // recalc displayed image size whenever natural or container sizes change
  useEffect(() => {
    if (!natW || !natH) {
      // not ready yet — use container fill
      setDispW(contW);
      setDispH(contH);
      return;
    }
    // compute scale to fit whole image inside container (contain)
    const scale = Math.min(contW / natW, contH / natH);
    const w = Math.round(natW * scale);
    const h = Math.round(natH * scale);
    setDispW(w);
    setDispH(h);
  }, [natW, natH, contW, contH]);

  // handle orientation / window size changes
  useEffect(() => {
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      setContW(window.width);
      setContH(window.height);
    };
    const sub = Dimensions.addEventListener ? Dimensions.addEventListener('change', onChange) : null;
    return () => {
      if (sub && typeof sub.remove === 'function') sub.remove();
      else if (Dimensions.removeEventListener) Dimensions.removeEventListener('change', onChange as any);
    };
  }, []);

  // fetch params from backend
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
    if (!recipeId) {
      Alert.alert('No recipe selected', 'Open a recipe first');
      return;
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  // map SR -> value param
  const valuesBySr = useMemo(() => {
    const map: Record<number, RecipeParam | null> = {};
    SR_LIST.forEach((sr) => {
      map[sr] = params.find((p) => Number(p.parameter_no) === sr) ?? null;
    });
    return map;
  }, [params]);

  // displayed image top-left coordinates inside container (centered)
  const offsetX = Math.round((contW - dispW) / 2);
  const offsetY = Math.round((contH - dispH) / 2);

  return (
    <SafeAreaView style={styles.fullscreen}>
      {/* Container fills the whole screen */}
      <View style={styles.flexFill} onLayout={(e) => { setContW(e.nativeEvent.layout.width); setContH(e.nativeEvent.layout.height); }}>
        {/* Image centered, sized to dispW x dispH, resizeMode contain (we emulate with exact size) */}
        <View style={{ width: contW, height: contH, alignItems: 'center', justifyContent: 'center' }}>
          <ImageBackground
            source={imageSource}
            style={{ width: dispW, height: dispH }}
            resizeMode="contain"
          >
            {/* Loading overlay on image */}
            {loading && (
              <View style={[styles.loadingOverlay, { width: dispW, height: dispH }]}>
                <ActivityIndicator size="large" color="#007bff" />
              </View>
            )}

            {/* Render overlays positioned relative to displayed image */}
            {SR_LIST.map((sr) => {
              const pos = POSITIONS_BY_SR[sr];
              if (!pos) return null;
              const param = valuesBySr[sr];
              const display = param ? String(param.value_01) : '';

              // Convert percent position -> px within the displayed image
              const leftPx = Math.round((pos.x / 100) * dispW);
              const topPx = Math.round((pos.y / 100) * dispH);

              return (
                <View
                  key={`ov-${sr}`}
                  style={[
                    styles.overlay,
                    {
                      left: leftPx,
                      top: topPx,
                      transform: [{ translateX: -40 }, { translateY: -12 }],
                      backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
                    },
                  ]}
                >
                  <Text style={[styles.overlayValue, isDark ? styles.textDark : styles.textDark]}>{display}</Text>
                </View>
              );
            })}
          </ImageBackground>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, backgroundColor: '#000' },
  flexFill: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    minWidth: 70,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayValue: { fontSize: 18, fontWeight: '700', color: '#000' },
  textDark: { color: '#000' },
});
