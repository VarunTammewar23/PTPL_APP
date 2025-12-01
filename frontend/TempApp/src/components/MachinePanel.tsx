// src/components/MachinePanel.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  Image,
} from 'react-native';
import ZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';

type Props = {
  recipeId: number;
  recipeName?: string;
  imageUri?: string;
  onClose?: () => void;
  initialParams?: any[];
  pollMs?: number;
};

interface RecipeParam {
  parameter_no: number;
  parameter: string;
  value_01: number | string;
  unit?: string;
}

const OVERLAY_WIDTH = 30;
const OVERLAY_HEIGHT = 24;
const OVERLAY_FONT_SIZE = 10;
const OVERLAY_BORDER_RADIUS = 8;

const POSITIONS_BY_SR: Record<number, { x: number; y: number }> = {
  1: { x: 18, y: 7 },
  2: { x: 10, y: 56 },
  3: { x: 20, y: 20 },
  4: { x: 63, y: 63 },
  5: { x: 90, y: 58 },
  6: { x: 90, y: 90 },
};

const SR_LIST = [1, 2, 3, 4, 5, 6];

export default function MachinePanel({
  recipeId,
  recipeName,
  imageUri,
  onClose,
  initialParams,
  pollMs = 2000,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState<boolean>(!initialParams);
  const [params, setParams] = useState<RecipeParam[]>(initialParams ?? []);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  const [contW, setContW] = useState<number>(Dimensions.get('window').width);
  const [contH, setContH] = useState<number>(
    Math.round(Dimensions.get('window').height * 0.45)
  );

  const [dispW, setDispW] = useState<number>(contW);
  const [dispH, setDispH] = useState<number>(contH);

  const imageSource = imageUri ? { uri: imageUri } : require('../assets/Paper_size.jpg');

  useEffect(() => {
    let mounted = true;

    const resolveLocal = (src: any) => {
      try {
        const resolved = Image.resolveAssetSource(src);
        if (mounted) {
          setNatW(resolved.width);
          setNatH(resolved.height);
        }
      } catch {
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
        () => {
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
  }, [imageUri, contW, contH, imageSource]);

  useEffect(() => {
    if (!natW || !natH) {
      setDispW(contW);
      setDispH(contH);
      return;
    }
    const scale = Math.min(contW / natW, contH / natH);
    setDispW(Math.round(natW * scale));
    setDispH(Math.round(natH * scale));
  }, [natW, natH, contW, contH]);

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number } }) => {
      setContW(window.width);
    };

    const sub: any =
      (Dimensions as any).addEventListener &&
      Dimensions.addEventListener('change', onChange);

    return () => {
      try {
        if (sub?.remove) sub.remove();
        else if ((Dimensions as any).removeEventListener)
          (Dimensions as any).removeEventListener('change', onChange);
      } catch {}
    };
  }, []);

  const fetchParams = async () => {
    try {
      const res = await apiGet(`/recipes/${recipeId}`, { timeout: 8000 });
      const p: RecipeParam[] = res.data?.params ?? [];
      setParams(p);
    } catch (err) {
      console.warn('MachinePanel fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    if (!initialParams) {
      setLoading(true);
      fetchParams();

      const id = setInterval(() => {
        if (!alive) return;
        fetchParams();
      }, pollMs);

      return () => {
        alive = false;
        clearInterval(id);
      };
    }
  }, [recipeId, initialParams, pollMs]);

  const valuesBySr = useMemo(() => {
    const map: Record<number, RecipeParam | null> = {};
    SR_LIST.forEach((sr) => {
      map[sr] =
        params.find((p) => Number(p.parameter_no) === sr) ?? null;
    });
    return map;
  }, [params]);

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width) setContW(width);
        if (height) setContH(height);
      }}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, isDark ? { color: '#fff' } : { color: '#111' }]}>
          {recipeName ?? `Recipe ${recipeId}`}
        </Text>

        {onClose ? (
          <Text style={styles.closeText} onPress={onClose}>
            Close
          </Text>
        ) : null}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ZoomableView
          minScale={1}
          maxScale={4}
          doubleTapScale={2}
          style={{ width: dispW, height: dispH }}
        >
          <ImageBackground
            source={imageSource}
            style={{ width: dispW, height: dispH }}
            resizeMode="contain"
          >
            {loading && (
              <View style={[styles.loadingOverlay, { width: dispW, height: dispH }]}>
                <ActivityIndicator size="large" />
              </View>
            )}

            {SR_LIST.map((sr) => {
              const pos = POSITIONS_BY_SR[sr];
              const param = valuesBySr[sr];
              const display = param ? String(param.value_01) : '';

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
                      transform: [
                        { translateX: -(OVERLAY_WIDTH / 2) },
                        { translateY: -(OVERLAY_HEIGHT / 2) },
                      ],
                      backgroundColor: isDark
                        ? 'rgba(0,0,0,0.6)'
                        : 'rgba(255,255,255,0.1)',
                      width: OVERLAY_WIDTH,
                      height: OVERLAY_HEIGHT,
                      borderRadius: OVERLAY_BORDER_RADIUS,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.overlayValue,
                      isDark ? { color: '#fff' } : { color: '#000' },
                      { fontSize: OVERLAY_FONT_SIZE },
                    ]}
                  >
                    {display}
                  </Text>
                </View>
              );
            })}
          </ImageBackground>
        </ZoomableView>
      </View>
    </View>
  ); // END return
} // END component


const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 220,
    maxHeight: 620,
    marginVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
  },

  closeText: {
    color: '#007bff',
    fontWeight: '700',
  },

  loadingOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  overlayValue: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
