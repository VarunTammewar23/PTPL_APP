// src/components/SideLay.tsx
import React, { useState, useEffect, useMemo, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
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

const OVERLAY_WIDTH = 47;
const OVERLAY_HEIGHT = 30;
const OVERLAY_FONT_SIZE = 12;
const OVERLAY_BORDER_RADIUS = 10;

// 🟢 positions for Side Lay (YOU CAN CHANGE COORDINATES IF REQUIRED)
const POSITIONS_BY_SR: Record<number, { x: number; y: number }> = {
  18: { x: 15, y: 10 },
};

const SR_LIST = [18];

const SERIAL_POSITIONS = [
  { id: 18, x: 28, y: 10 },
];

function SideLayInner(
  { recipeId, imageUri, onClose, initialParams, pollMs = 2000 }: Props,
  ref: any
) {
  const zoomRef = useRef<any>(null);
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

  const imageSource = imageUri ? { uri: imageUri } : require('../assets/sidelay.jpeg');

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
        (w, h) => mounted && (setNatW(w), setNatH(h)),
        () => mounted && (setNatW(contW), setNatH(contH))
      );
    } else {
      resolveLocal(imageSource);
    }
    return () => { mounted = false };
  }, [imageUri]);

  useEffect(() => {
    if (!natW || !natH) return;
    const s = Math.min(contW / natW, contH / natH);
    setDispW(Math.round(natW * s));
    setDispH(Math.round(natH * s));
  }, [natW, natH, contW, contH]);

  useEffect(() => setZoomKey(k => k + 1), [isLandscape]);

  const fetchParams = async () => {
    try {
      const res = await apiGet(`/recipes/${recipeId}`, { timeout: 8000 });
      const p: RecipeParam[] = res.data?.params ?? [];
      setParams(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialParams) {
      fetchParams();
      const id = setInterval(fetchParams, pollMs);
      return () => clearInterval(id);
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
        value_01:
          editedValues[sr] !== undefined
            ? editedValues[sr]
            : valuesBySr[sr]?.value_01 ?? '',
        unit: valuesBySr[sr]?.unit ?? '',
      })),
    clearEdits: () => {
      setEditedValues({});
      setEditingSr(null);
      setTempValue('');
    }
  }));

  const openEditor = (sr: number, curr: string) => {
    setEditingSr(sr);
    setTempValue(curr ?? '');
  };

  const saveEditor = () => {
    if (!editingSr) return;
    setEditedValues(p => ({ ...p, [editingSr]: tempValue }));
    setEditingSr(null);
    setTempValue('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#111' }]}>
          SIDE LAY SETTINGS
        </Text>
        {onClose && <Text style={styles.closeText} onPress={onClose}>Close</Text>}
      </View>

      <View style={[styles.orientationWrap, { flexDirection: isLandscape ? 'row' : 'column' }]}>

        <View style={[styles.imageContainer, { width: isLandscape ? '50%' : '100%', flex: 1 }]}>
          <ZoomableView
            key={zoomKey}
            ref={zoomRef}
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
                const value = editedValues[sr] ?? param?.value_01 ?? '';

                const left = Math.round((pos.x / 100) * dispW);
                const top = Math.round((pos.y / 100) * dispH);

                return (
                  <TouchableOpacity
                    key={`ov-${sr}`}
                    activeOpacity={0.8}
                    onPress={() => openEditor(sr, String(value))}
                    style={[
                      styles.overlay,
                      {
                        left,
                        top,
                        backgroundColor: isDark ? '#0009' : '#fff9',
                        width: OVERLAY_WIDTH,
                        height: OVERLAY_HEIGHT,
                        borderRadius: OVERLAY_BORDER_RADIUS,
                        transform: [{ translateX: -23.5 }, { translateY: -15 }],
                      },
                    ]}
                  >
                    <Text style={[styles.overlayValue, { color: isDark ? '#fff' : '#000' }]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {SERIAL_POSITIONS.map(i => (
                <View
                  key={`serial-${i.id}`}
                  pointerEvents="none"
                  style={[
                    styles.serialOverlay,
                    {
                      left: Math.round((i.x / 100) * dispW),
                      top: Math.round((i.y / 100) * dispH),
                      width: OVERLAY_WIDTH,
                      height: OVERLAY_HEIGHT,
                    },
                  ]}
                >
                  <Text style={styles.serialText}>{i.id}</Text>
                </View>
              ))}
            </ImageBackground>
          </ZoomableView>
        </View>

        {/* Side table */}
        <View style={[styles.tableContainer, { flex: 1, width: isLandscape ? '50%' : '100%' }]}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1 }]}>SR</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Original</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Changed</Text>
          </View>

          {SR_LIST.map(sr => {
            const orig = valuesBySr[sr]?.value_01 ?? '';
            const changed = editedValues[sr] ?? '';

            return (
              <View key={`row-${sr}`} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1 }]}>{sr}</Text>
                <Text style={[styles.td, { flex: 1.5 }]}>{orig}</Text>
                <Text style={[styles.td, { flex: 1.5, color: changed ? 'blue' : '#111' }]}>{changed || '-'}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* edit modal */}
      <Modal visible={editingSr !== null} animationType="fade" transparent>
        <View style={modal.overlay}>
          <View style={modal.box}>
            <Text style={modal.title}>Edit Value (SR {editingSr})</Text>
            <TextInput
              style={modal.input}
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType="numeric"
              placeholder="Enter value"
            />
            <View style={modal.row}>
              <TouchableOpacity onPress={() => (setEditingSr(null), setTempValue(''))}>
                <Text style={modal.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEditor}>
                <Text style={modal.save}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0006' },
  box: { backgroundColor: '#fff', padding: 14, width: '85%', maxWidth: 420, borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 10, borderRadius: 6, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancel: { marginRight: 20, color: '#666' },
  save: { color: '#007bff', fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  closeText: { color: '#007bff', fontWeight: '700' },

  orientationWrap: { flex: 1, width: '100%' },
  imageContainer: {overflow: 'hidden', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  overlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  overlayValue: { fontSize: OVERLAY_FONT_SIZE, fontWeight: '700' },

  serialOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', borderRadius: 6 },
  serialText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  tableContainer: { backgroundColor: '#fff', borderRadius: 6, marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#e8e8f5', padding: 6 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },

  th: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#111' },
  td: { textAlign: 'center', fontSize: 12, color: '#333' },
});

export default React.forwardRef(SideLayInner);
