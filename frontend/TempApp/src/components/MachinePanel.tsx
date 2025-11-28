// src/components/MachinePanel.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import ZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';

type Props = {
  recipeId: number;
  recipeName?: string;
  imageUri?: string;
  onClose?: () => void; // optional: MainScreen will hide panel when called
  initialParams?: any[]; // optional: pass already-fetched params to avoid a re-fetch
  pollMs?: number;
};

interface RecipeParam {
  parameter_no: number;
  parameter: string;
  value_01: number | string;
  unit?: string;
}

/** coordinates as percentage of displayed image */
const POSITIONS_BY_SR: Record<number, { x: number; y: number }> = {
  1: { x: 20, y: 4 },
  2: { x: 12, y: 55 },
  3: { x: 20, y: 20 },
  4: { x: 65, y: 60 },
};
const SR_LIST = [1, 2, 3, 4];

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

  // natural image size (pixels)
  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  // container size (available parent area) — parent should size this container
  const [contW, setContW] = useState<number>(Dimensions.get('window').width);
  const [contH, setContH] = useState<number>(Math.round(Dimensions.get('window').height * 0.45)); // default height if parent doesn't provide

  // displayed image size (contain)
  const [dispW, setDispW] = useState<number>(contW);
  const [dispH, setDispH] = useState<number>(contH);

  // CORRECT require path: relative from src/components -> ../assets/Paper_size.jpg
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
        (w, h) => { if (!mounted) return; setNatW(w); setNatH(h); },
        () => { if (mounted) { setNatW(contW); setNatH(contH); } }
      );
    } else {
      resolveLocal(imageSource);
    }

    return () => { mounted = false; };
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
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      // keep container width as parent width; height remains as we set (parent could override via style)
      setContW(window.width);
    };

    // Dimensions.addEventListener returns an event subscription; handle both RN <=0.65 and newer APIs
    const sub: any = (Dimensions as any).addEventListener ? Dimensions.addEventListener('change', onChange) : null;

    return () => {
      // remove listener safely depending on RN version
      try {
        if (sub && typeof sub.remove === 'function') sub.remove();
        // newer RN versions return an EmitterSubscription with remove(); older versions need removeEventListener
        else if ((Dimensions as any).removeEventListener) (Dimensions as any).removeEventListener('change', onChange);
      } catch {
        // ignore removal errors
      }
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
      return () => { alive = false; clearInterval(id); };
    }
    // if initialParams provided, we don't poll here (MainScreen can handle polling if desired)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId, initialParams]);

  const valuesBySr = useMemo(() => {
    const map: Record<number, RecipeParam | null> = {};
    SR_LIST.forEach((sr) => {
      map[sr] = params.find((p) => Number(p.parameter_no) === sr) ?? null;
    });
    return map;
  }, [params]);

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        // allow parent to size this component; but also set fallback contH if needed
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
          <Text style={styles.closeText} onPress={onClose}>Close</Text>
        ) : null}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ZoomableView minScale={1} maxScale={4} doubleTapScale={2} style={{ width: dispW, height: dispH }}>
          <ImageBackground source={imageSource} style={{ width: dispW, height: dispH }} resizeMode="contain">
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
                      transform: [{ translateX: -40 }, { translateY: -12 }],
                      backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                    },
                  ]}
                >
                  <Text style={[styles.overlayValue, isDark ? { color: '#fff' } : { color: '#000' }]}>
                    {display}
                  </Text>
                </View>
              );
            })}
          </ImageBackground>
        </ZoomableView>
      </View>

      {/* Optional parameters list preview (scrollable) */}
      <View style={styles.paramsPreview}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {params.length === 0 ? (
            <Text style={{ padding: 8, color: '#666' }}>No params</Text>
          ) : (
            params.slice(0, 8).map((p) => (
              <View key={String(p.parameter_no)} style={styles.paramChip}>
                <Text style={styles.paramChipText}>{p.parameter}: {p.value_01}{p.unit ? ` ${p.unit}` : ''}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 220, maxHeight: 520, marginVertical: 8, backgroundColor: '#f9fafb', borderRadius: 8, padding: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700' },
  closeText: { color: '#007bff', fontWeight: '700' },
  loadingOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', minWidth: 70, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  overlayValue: { fontSize: 18, fontWeight: '700' },
  paramsPreview: { marginTop: 8, height: 46 },
  paramChip: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 8, marginRight: 8, borderRadius: 6, borderWidth: 1, borderColor: '#eee' },
  paramChipText: { fontSize: 13, fontWeight: '600' },
});
