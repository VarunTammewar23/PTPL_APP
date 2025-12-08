// src/components/MachinePanel.tsx
import React, { useEffect, useMemo, useState, useImperativeHandle, useRef, useCallback } from 'react';
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
  PixelRatio,
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
  onDirtyChange?: (dirty: boolean) => void; // NEW
  onValuesChange?: (rows: any[]) => void; // NEW

};

interface RecipeParam {
  parameter_no: number;
  section?: string;
  parameter?: string;
  value_01?: number | string;
  unit?: string;
}

const OVERLAY_WIDTH = 80;
const OVERLAY_HEIGHT = 30;

const { width: SCREEN_W } = Dimensions.get('window');
const BASE_WIDTH = 360;
const SCALE = SCREEN_W / BASE_WIDTH;
const CLAMPED_SCALE = Math.max(0.85, Math.min(SCALE, 1.15));

const OVERLAY_FONT_SIZE = 17 * CLAMPED_SCALE * PixelRatio.getFontScale();
const SERIAL_FONT_SIZE = 17 * CLAMPED_SCALE * PixelRatio.getFontScale();

const POSITIONS_BY_SR: Record<number, { x: number; y: number }> = {
  1: { x: 140, y: 118 },
  2: { x: 42, y: 103 },
  3: { x: 60, y: 35 },
  4: { x: 58, y: 15 },
  5: { x: 197, y: 170 },
  6: { x: 195, y: 112 },
};

const SR_LIST = [1, 2, 3, 4, 5, 6];

const SERIAL_POSITIONS = [
  { id: 1, x: 125, y: 130 },
  { id: 2, x: 42, y: 117 },
  { id: 3, x: 41, y: 47 },
  { id: 4, x: 77, y: 15 },
  { id: 5, x: 193, y: 183 },
  { id: 6, x: 189, y: 99 },
];

function MachinePanelInner(
  { recipeId, imageUri, onClose, initialParams, pollMs = 2000, onDirtyChange, onValuesChange, recipeName }: Props,
  ref: any
)
 {
  const zoomRef = useRef<any>(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState<boolean>(!initialParams);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  const [contW, setContW] = useState<number>(Dimensions.get('window').width);
  const [contH, setContH] = useState<number>(
    Math.round(Dimensions.get('window').height * 0.40)
  );

  const [params, setParams] = useState<RecipeParam[]>(Array.isArray(initialParams) ? initialParams : []);
  const valuesBySr = useMemo(() => {
    const map: Record<number, RecipeParam | null> = {};
    SR_LIST.forEach(sr => {
      map[sr] = params.find(p => Number(p.parameter_no) === sr) ?? null;
    });
    return map;
  }, [params]);

  const OVERLAY_BORDER_RADIUS = 10;


  const [dispW, setDispW] = useState<number>(contW);
  const [dispH, setDispH] = useState<number>(contH);

  const imageSource = imageUri ? { uri: imageUri } : require('../assets/Paper_size.jpg');

  const [editedValues, setEditedValues] = useState<Record<number, string>>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const [tablePopup, setTablePopup] = useState(false);

  // NEW dirty tracking
  const lastDirtyRef = useRef<boolean>(false);
  useEffect(() => {
    const isDirty = Object.keys(editedValues).length > 0;
    if (lastDirtyRef.current !== isDirty) {
      lastDirtyRef.current = isDirty;
      if (typeof onDirtyChange === 'function') {
        onDirtyChange(isDirty);
      }
    }
  }, [editedValues, onDirtyChange]);

  // NEW: live sync edited values to MainScreen
  // NEW: live sync edited values to MainScreen (stable handler via ref)
  const rowsForValuesChange = useMemo(() => {
    return SR_LIST.map(sr => ({
      recipe_name: recipeName,
      customer_code: undefined,
      parameter_no: sr,
      section: valuesBySr[sr]?.section ?? '',
      parameter: valuesBySr[sr]?.parameter ?? '',
      value_01:
        editedValues[sr] !== undefined
          ? editedValues[sr]
          : valuesBySr[sr]?.value_01 ?? '',
      unit: valuesBySr[sr]?.unit ?? '',
    }));
  }, [editedValues, recipeName, valuesBySr]);

  const onValuesChangeRef = useRef<typeof onValuesChange | null>(null);
  useEffect(() => { onValuesChangeRef.current = onValuesChange ?? null; }, [onValuesChange]);

  // Only call the parent handler when rows actually change to avoid render loops.
  const prevRowsJsonRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      const json = JSON.stringify(rowsForValuesChange);
      if (json === prevRowsJsonRef.current) return;
      prevRowsJsonRef.current = json;
      if (typeof onValuesChangeRef.current === 'function') {
        onValuesChangeRef.current(rowsForValuesChange);
      }
    } catch (err) {
      console.log('onValuesChange handler failed', err);
    }
  }, [rowsForValuesChange]);





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
    if (natW && natH) {
      const scale = Math.min(contW / natW, contH / natH);
      setDispW(Math.round(natW * scale));
      setDispH(Math.round(natH * scale));
    }
  }, [natW, natH, contW, contH]);

  const fetchParams = useCallback(async () => {
  try {
    const res = await apiGet(`/recipes/${recipeId}`, { timeout: 8000 });
    const p: RecipeParam[] = res.data?.params ?? [];
    setParams(p);

    // NEW: log section values clearly
    console.log("----- PAPER SIZES RAW PARAMS -----");
    p.forEach(x => console.log(`SR ${x.parameter_no}: Section=${x.section}, Param=${x.parameter}, Value=${x.value_01}`));
    console.log("-----------------------------------");

  } catch (e) {
    console.log("Fetch error:", e);
  }
  finally { setLoading(false); }
}, [recipeId]);


  useEffect(() => {
    let alive = true;
    if (!initialParams) {
      setLoading(true);
      fetchParams();
      const id = setInterval(() => alive && fetchParams(), pollMs);
      return () => { alive = false; clearInterval(id); };
    } else setParams(initialParams);
  }, [initialParams, fetchParams, pollMs]);

  

  console.log("PAPER SIZES SECTION VALUES:", valuesBySr);


  // NEW: Ensure backend shaped return
  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      SR_LIST.map(sr => ({
        recipe_name: recipeName ?? undefined,
        customer_code: undefined, // MainScreen will add if needed
        parameter_no: sr,
        section: valuesBySr[sr]?.section ?? '',
        parameter: valuesBySr[sr]?.parameter ?? '',
        value_01:
          editedValues[sr] !== undefined
            ? editedValues[sr]
            : valuesBySr[sr]?.value_01 ?? '',
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

      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>RPF : PAPER SIZES</Text>
      </View>

      {/* IMAGE ALWAYS VISIBLE */}
      <View style={[styles.imageContainer, { width: '100%', flex: 1 }]}>
        <ZoomableView
          ref={zoomRef}
          minScale={1}
          maxScale={4}
          doubleTapScale={2}
          bindToBorders={true}
          style={{ flex: 1, width: '100%', height: '100%' }}
        >

          <ImageBackground source={imageSource} resizeMode="contain" style={{ flex: 1, width: '100%', height: '100%' }}>

            {/* PARAMETER OVERLAYS */}
            {SR_LIST.map(sr => {
              if (dispW <= 0 || dispH <= 0) return null;
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

            {/* SERIAL LABELS */}
            {SERIAL_POSITIONS.map(item => {
              if (dispW <= 0 || dispH <= 0) return null;
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

      {/* FLOATING ACTION BUTTONS */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setTablePopup(true)}
        >
          <Text style={styles.fabButtonText}>SHOW TABLE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => console.log("Video clicked")}
        >
          <Text style={styles.fabButtonText}>VIDEO</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: TABLE POPUP */}
      <Modal visible={tablePopup} animationType="fade" transparent onRequestClose={() => setTablePopup(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <Text style={modalStyles.title}>Parameter Table</Text>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 0.7 }]}>SR</Text>
                <Text style={[styles.th, { flex: 2 }]}>Parameter</Text>
                <Text style={[styles.th, { flex: 1.3 }]}>Original</Text>
                <Text style={[styles.th, { flex: 1.3 }]}>Changed</Text>
              </View>

              {SR_LIST.map(sr => {
                const orig = valuesBySr[sr]?.value_01 ?? '';
                const paramName = valuesBySr[sr]?.parameter ?? '';
                const changed = editedValues[sr] ?? '';

                return (
                  <View key={`row-${sr}`} style={styles.tableRow}>
                    <Text style={[styles.td, { flex: 0.7 }]}>{sr}</Text>
                    <Text style={[styles.td, { flex: 2 }]}>{paramName}</Text>
                    <Text style={[styles.td, { flex: 1.3 }]}>{orig}</Text>
                    <Text style={[styles.td, { flex: 1.3, color: changed ? 'blue' : '#111' }]}>
                      {changed || '-'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity onPress={() => setTablePopup(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: '#007bff', fontWeight: '700', textAlign: 'center' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VALUE EDIT MODAL */}
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
    backgroundColor: '#ffffffff',
    width: '100%',
    maxWidth: 820,
    padding: 18,
    borderRadius: 10,
    elevation: 8,
  },
  title: { fontWeight: '700', fontSize: 20, marginBottom: 8 },
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
    flex: 1,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#fff',
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
    fontSize: 18,
    textAlign: 'center',
    color: '#111',
  },

  td: {
    fontSize: 18,
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
    backgroundColor: '#f9fafb',
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginTop: 0,
    marginBottom: 0,
    position: 'relative',
  },

  headerRow: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    marginBottom: 0,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
  },

  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
  },

  overlayValue: {
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
    includeFontPadding: false,
  },

  fabContainer: {
    position: 'absolute',
    bottom: 12,
    left: '10%',
    flexDirection: 'row',
    alignItems: 'center'
  },

  fabButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    elevation: 5,
    marginRight: 10,
  },

  fabButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

});

export default React.forwardRef(MachinePanelInner);
