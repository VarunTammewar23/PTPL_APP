// src/components/MachinePanel.tsx
import React, { useEffect, useMemo, useState, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  PixelRatio, // ✅ already added earlier
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
  section?: string;
  parameter?: string;
  value_01?: number | string;
  unit?: string;
}

// ❗ Only these constants changed a bit (for font size)
const OVERLAY_WIDTH = 47;
const OVERLAY_HEIGHT = 30;

const { width: SCREEN_W } = Dimensions.get('window');
const BASE_WIDTH = 360;
const SCALE = SCREEN_W / BASE_WIDTH;
const CLAMPED_SCALE = Math.max(0.85, Math.min(SCALE, 1.15)); // clamp so it doesn't explode on tab-mode phones

const OVERLAY_FONT_SIZE = 12 * CLAMPED_SCALE * PixelRatio.getFontScale();
const SERIAL_FONT_SIZE = 10 * CLAMPED_SCALE * PixelRatio.getFontScale();

const OVERLAY_BORDER_RADIUS = 10;

const POSITIONS_BY_SR: Record<number, { x: number; y: number }> = {
  1: { x: 18, y: 7 },
  2: { x: 10, y: 56 },
  3: { x: 20, y: 20 },
  4: { x: 63, y: 63 },
  5: { x: 90, y: 58 },
  6: { x: 90, y: 90 },
};

const SR_LIST = [1, 2, 3, 4, 5, 6];

const SERIAL_POSITIONS = [
  { id: 1, x: 28, y: 7 },
  { id: 2, x: 10, y: 68 },
  { id: 3, x: 30, y: 20 },
  { id: 4, x: 55, y: 62 },
  { id: 5, x: 88, y: 48 },
  { id: 6, x: 93, y: 78 },
];

function MachinePanelInner(
  { recipeId, imageUri, onClose, initialParams, pollMs = 2000 }: Props,
  ref: any
) {
  const zoomRef = useRef<any>(null);  // 🔥 ADDED for reset

  const [zoomKey, setZoomKey] = useState(0);

  const [isLandscape, setIsLandscape] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height
  );

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState<boolean>(!initialParams);
  const [params, setParams] = useState<RecipeParam[]>(initialParams ?? []);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  const [contW, setContW] = useState<number>(Dimensions.get('window').width);
  const [contH, setContH] = useState<number>(
    Math.round(Dimensions.get('window').height * 0.40)
  );

  const [dispW, setDispW] = useState<number>(contW);
  const [dispH, setDispH] = useState<number>(contH);

  const imageSource = imageUri ? { uri: imageUri } : require('../assets/Paper_size.jpg');

  const [editedValues, setEditedValues] = useState<Record<number, string>>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    const onChange = ({ window }) => {
      const landscape = window.width > window.height;
      setIsLandscape(landscape);
      setContW(window.width);
      setContH(Math.round(window.height * (landscape ? 0.85 : 0.40)));
    };

    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

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

    return () => { mounted = false };
  }, [imageUri]);

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

  // 🔁 Recalculate size on orientation change
  useEffect(() => {
    if (!natW || !natH) return;
    const scale = Math.min(contW / natW, contH / natH);
    setDispW(Math.round(natW * scale));
    setDispH(Math.round(natH * scale));
  }, [isLandscape]);

  // 🔥 RESET ZOOM ON ORIENTATION CHANGE
  useEffect(() => {
    setZoomKey(prev => prev + 1);  // forces re-render & resets zoom
  }, [isLandscape]);


  const fetchParams = async () => {
    try {
      const res = await apiGet(`/recipes/${recipeId}`, { timeout: 8000 });
      const p: RecipeParam[] = res.data?.params ?? [];
      setParams(p);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    if (!initialParams) {
      setLoading(true);
      fetchParams();
      const id = setInterval(() => alive && fetchParams(), pollMs);
      return () => { alive = false; clearInterval(id); };
    } else setParams(initialParams);
  }, [recipeId]);

  const valuesBySr = useMemo(() => {
    const map: Record<number, RecipeParam | null> = {};
    SR_LIST.forEach(sr => {
      map[sr] = params.find(p => Number(p.parameter_no) === sr) ?? null;
    });
    return map;
  }, [params]);

  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      SR_LIST.map(sr => ({
        parameter_no: sr,
        section: valuesBySr[sr]?.section ?? '',
        parameter: valuesBySr[sr]?.parameter ?? '',
        value_01: editedValues[sr] !== undefined ? editedValues[sr] : valuesBySr[sr]?.value_01 ?? '',
        unit: valuesBySr[sr]?.unit ?? '',
      })),
  }));

  const openEditor = (sr: number, current: string) => {
    setEditingSr(sr);
    setTempValue(String(current ?? ''));
  };

  const saveEditor = () => {
    if (editingSr === null) return;
    setEditedValues(prev => ({ ...prev, [editingSr]: tempValue }));
    setEditingSr(null);
    setTempValue('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#111', fontSize: 15 }]}>
          PAPER SIZES
        </Text>
        {onClose && <Text style={styles.closeText} onPress={onClose}>Close</Text>}
      </View>

      <View style={[styles.orientationWrap, { flexDirection: isLandscape ? 'row' : 'column' }]}>
        <View
          style={[styles.imageContainer, { width: isLandscape ? '50%' : '100%', flex: 1 }]}
        >
          <ZoomableView
            key={zoomKey}      // 🔥 THIS RESETS ZOOM ON ROTATION
            ref={zoomRef}          // 🔥 ADDED
            minScale={1}
            maxScale={4}
            doubleTapScale={2}
            bindToBorders={true}
            style={{ width: dispW, height: dispH }}
          >
            <ImageBackground source={imageSource} resizeMode="contain" style={{ width: dispW, height: dispH }}>
              {SR_LIST.map(sr => {
                const pos = POSITIONS_BY_SR[sr];
                const param = valuesBySr[sr];
                const display = editedValues[sr] !== undefined
                  ? String(editedValues[sr])
                  : param ? String(param.value_01 ?? '') : '';

                const leftPx = Math.round((pos.x / 100) * dispW);
                const topPx = Math.round((pos.y / 100) * dispH);

                return (
                  <TouchableOpacity
                    key={`ov-${sr}`}
                    activeOpacity={0.8}
                    onPress={() => openEditor(sr, display)}
                    style={[
                      styles.overlay,
                      {
                        left: leftPx,
                        top: topPx,
                        backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.15)',
                        transform: [
                          { translateX: -(OVERLAY_WIDTH / 2) },
                          { translateY: -(OVERLAY_HEIGHT / 2) },
                        ],
                        width: OVERLAY_WIDTH,
                        height: OVERLAY_HEIGHT,
                        borderRadius: OVERLAY_BORDER_RADIUS,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.overlayValue,
                      { color: isDark ? '#fff' : '#000', fontSize: OVERLAY_FONT_SIZE }
                    ]}>
                      {display}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {SERIAL_POSITIONS.map(item => {
                const leftPx = Math.round((item.x / 100) * dispW);
                const topPx = Math.round((item.y / 100) * dispH);

                return (
                  <View
                    key={`serial-${item.id}`}
                    pointerEvents="none"
                    style={[
                      styles.serialOverlay,
                      {
                        left: leftPx,
                        top: topPx,
                        width: OVERLAY_WIDTH,
                        height: OVERLAY_HEIGHT,
                        transform: [
                          { translateX: -(OVERLAY_WIDTH / 2) },
                          { translateY: -(OVERLAY_HEIGHT / 2) },
                        ],
                      },
                    ]}
                  >
                    <Text style={[styles.serialText, { fontSize: SERIAL_FONT_SIZE }]}>
                      {item.id}
                    </Text>
                  </View>
                );
              })}
            </ImageBackground>
          </ZoomableView>
        </View>

        <View style={[
          styles.tableContainer,
          { flex: 1, width: isLandscape ? '50%' : '100%', marginTop: isLandscape ? 0 : 8 }
        ]}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1 }]}>SR</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Original Value</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Changed Value</Text>
          </View>

          {SR_LIST.map(sr => {
            const orig = valuesBySr[sr]?.value_01 ?? '';
            const changed = editedValues[sr] ?? '';

            return (
              <View key={`row-${sr}`} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1 }]}>{sr}</Text>
                <Text style={[styles.td, { flex: 1.5 }]}>{orig}</Text>
                <Text style={[styles.td, { flex: 1.5, color: changed ? 'blue' : '#111' }]}>
                  {changed || '-'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Modal visible={editingSr !== null} animationType="fade" transparent onRequestClose={() => setEditingSr(null)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <Text style={modalStyles.title}>Edit Value (SR {editingSr})</Text>
            <TextInput
              style={modalStyles.input}
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType="numeric"
              placeholder="Enter value"
            />
            <View style={modalStyles.row}>
              <TouchableOpacity onPress={() => { setEditingSr(null); setTempValue(''); }}>
                <Text style={modalStyles.cancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={saveEditor}>
                <Text style={modalStyles.save}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ------------------------ STYLES ------------------------ */

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  box: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 420,
    padding: 14,
    borderRadius: 10,
    elevation: 8,
  },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancel: { marginRight: 20, color: '#666' },
  save: { fontWeight: '700', color: '#007bff' },
});

const styles = StyleSheet.create({
  imageContainer: {
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },

  orientationWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tableContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e8e8f5',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  th: {
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    color: '#111',
  },

  td: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },

  serialOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 6,
  },

  serialText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },

  container: {
    flex: 1,
    minHeight: 220,
    maxHeight: 620,
    marginVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    paddingTop: 0,
    overflow: 'hidden',
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

  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  overlayValue: {
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,   // makes text cleaner
    includeFontPadding: false,
  },
});

export default React.forwardRef(MachinePanelInner);
