// src/components/FoldingTray.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useImperativeHandle,
  useRef
} from 'react';
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

const OVERLAY_WIDTH = 48;
const OVERLAY_HEIGHT = 30;
const OVERLAY_FONT_SIZE = 12;
const OVERLAY_BORDER_RADIUS = 10;

/* ---------------------------------------------
   CHANGE THESE VALUES AS PER THE FOLDING TRAY UI
----------------------------------------------- */
const POSITIONS_BY_SR: Record<number, { x: number; y: number }> = {
  1: { x: 20, y: 20 },
  2: { x: 60, y: 25 },
  3: { x: 40, y: 70 },
};

const SR_LIST = [1, 2, 3];

const SERIAL_POSITIONS = [
  { id: 1, x: 20, y: 30 },
  { id: 2, x: 60, y: 35 },
  { id: 3, x: 40, y: 80 },
];

/* --------------------------------------------- */

function FoldingTrayInner(
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

  const imageSource = imageUri
    ? { uri: imageUri }
    : require('../assets/FoldingTray.jpeg'); // CHANGE THIS IMAGE IF NEEDED

  const [editedValues, setEditedValues] = useState<Record<number, string>>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    const onChange = ({ window }) => {
      const land = window.width > window.height;
      setIsLandscape(land);
      setContW(window.width);
      setContH(Math.round(window.height * (land ? 0.85 : 0.40)));
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    let mounted = true;
    const resolveLocal = (src: any) => {
      try {
        const r = Image.resolveAssetSource(src);
        if (mounted) setNatW(r.width), setNatH(r.height);
      } catch {
        mounted && (setNatW(contW), setNatH(contH));
      }
    };

    if (imageUri) {
      Image.getSize(
        imageUri,
        (w, h) => mounted && (setNatW(w), setNatH(h)),
        () => mounted && (setNatW(contW), setNatH(contH))
      );
    } else resolveLocal(imageSource);

    return () => (mounted = false);
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
      setParams(res.data?.params ?? []);
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

  const save = () => {
    if (!editingSr) return;
    setEditedValues(p => ({ ...p, [editingSr]: tempValue }));
    setEditingSr(null);
    setTempValue('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#111' }]}>
          FOLDING TRAY SETTINGS
        </Text>
        {onClose && <Text style={styles.closeText} onPress={onClose}>Close</Text>}
      </View>

      <View style={[styles.wrapper, { flexDirection: isLandscape ? 'row' : 'column' }]}>

        <View style={[styles.imageWrap, { width: isLandscape ? '50%' : '100%', flex: 1 }]}>
          <ZoomableView
            key={zoomKey}
            ref={zoomRef}
            minScale={1}
            maxScale={4}
            doubleTapScale={2}
            bindToBorders
            style={{ width: dispW, height: dispH }}
          >
            <ImageBackground source={imageSource} resizeMode="contain" style={{ width: dispW, height: dispH }}>
              {SR_LIST.map(sr => {
                const pos = POSITIONS_BY_SR[sr];
                const param = valuesBySr[sr];
                const value = editedValues[sr] ?? param?.value_01 ?? '';
                return (
                  <TouchableOpacity
                    key={`ov-${sr}`}
                    onPress={() => openEditor(sr, String(value))}
                    style={[
                      styles.overlay,
                      {
                        left: Math.round((pos.x / 100) * dispW),
                        top: Math.round((pos.y / 100) * dispH),
                        width: OVERLAY_WIDTH,
                        height: OVERLAY_HEIGHT,
                        borderRadius: OVERLAY_BORDER_RADIUS,
                        transform: [{ translateX: -OVERLAY_WIDTH / 2 }, { translateY: -15 }],
                        backgroundColor: isDark ? '#0009' : '#fff9',
                      }
                    ]}
                  >
                    <Text style={[styles.overlayValue, { fontSize: OVERLAY_FONT_SIZE, color: isDark ? '#fff' : '#000' }]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {SERIAL_POSITIONS.map(i => (
                <View
                  key={`sid-${i.id}`}
                  pointerEvents="none"
                  style={[
                    styles.serialOverlay,
                    {
                      left: Math.round((i.x / 100) * dispW),
                      top: Math.round((i.y / 100) * dispH),
                      width: OVERLAY_WIDTH,
                      height: OVERLAY_HEIGHT,
                      transform: [{ translateX: -OVERLAY_WIDTH / 2 }, { translateY: -15 }],
                    }
                  ]}
                >
                  <Text style={styles.serialText}>{i.id}</Text>
                </View>
              ))}
            </ImageBackground>
          </ZoomableView>
        </View>

        <View style={[styles.table, { flex: 1, width: isLandscape ? '50%' : '100%' }]}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 1 }]}>SR</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Original</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Changed</Text>
          </View>

          {SR_LIST.map(sr => {
            const orig = valuesBySr[sr]?.value_01 ?? '';
            const changed = editedValues[sr] ?? '';
            return (
              <View key={sr} style={styles.row}>
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

      <Modal visible={editingSr !== null} transparent animationType="fade">
        <View style={modal.overlay}>
          <View style={modal.box}>
            <Text style={modal.title}>Edit Value (SR {editingSr})</Text>
            <TextInput style={modal.input} value={tempValue} onChangeText={setTempValue} keyboardType="numeric" />
            <View style={modal.row}>
              <Text style={modal.cancel} onPress={() => (setEditingSr(null), setTempValue(''))}>Cancel</Text>
              <Text style={modal.save} onPress={save}>Save</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0006', justifyContent: 'center', alignItems: 'center' },
  box: { backgroundColor: '#fff', padding: 14, borderRadius: 10, width: '85%', maxWidth: 420 },
  title: { fontSize: 16, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginVertical: 10, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancel: { marginRight: 20, color: '#666' },
  save: { color: '#007bff', fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  closeText: { fontWeight: '700', color: '#007bff' },

  wrapper: { flex: 1 },

  imageWrap: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  overlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  overlayValue: { fontWeight: '700' },

  serialOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', borderRadius: 6 },
  serialText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  table: { backgroundColor: '#fff', borderRadius: 6, marginTop: 8 },
  tableHead: { flexDirection: 'row', backgroundColor: '#e8e8f5', paddingVertical: 6 },
  row: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },

  th: { fontWeight: '700', textAlign: 'center', fontSize: 12 },
  td: { textAlign: 'center', fontSize: 12 },
});

export default React.forwardRef(FoldingTrayInner);
