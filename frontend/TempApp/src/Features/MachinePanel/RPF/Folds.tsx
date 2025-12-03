import React, { useEffect, useMemo, useState, useImperativeHandle } from 'react';
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
} from 'react-native';
import ZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { useTheme } from '../../../theme/ThemeProvider';
import { apiGet } from '../../../api/api';

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

// BOX SIZE CONFIG
const BOX_W = 30;
const BOX_H = 24;

const POSITIONS: Record<number, { x: number; y: number }> = {
  7: { x: 81, y: 21 },
  8: { x: 81, y: 45 },
  9: { x: 81, y: 70 },
};
const PARAM_SR = [7, 8, 9];

// SERIAL NUMBER POSITIONS
const SERIAL_POS = [
  { id: 7, x: 5, y: 21 },
  { id: 8, x: 5, y: 47 },
  { id: 9, x: 5, y: 72 },
];

function FoldsInner(
  { recipeId, recipeName, imageUri, onClose, initialParams, pollMs = 2000 }: Props,
  ref: any
) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [loading, setLoading] = useState(!initialParams);
  const [params, setParams] = useState<RecipeParam[]>(initialParams ?? []);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  const [contW, setContW] = useState(Dimensions.get('window').width);
  const [contH, setContH] = useState(Math.round(Dimensions.get('window').height * 0.45));

  const [dispW, setDispW] = useState(contW);
  const [dispH, setDispH] = useState(contH);

  const imgSrc = imageUri ? { uri: imageUri } : require('../../../assets/Images/folds.jpeg'); // 📌 your image

  const [edited, setEdited] = useState<Record<number, string>>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState('');

  // Load params
  const fetchParams = async () => {
    try {
      const res = await apiGet(`/recipes/${recipeId}`, { timeout: 8000 });
      setParams(res.data?.params ?? []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!initialParams) {
      fetchParams();
      const id = setInterval(fetchParams, pollMs);
      return () => clearInterval(id);
    } else {
      setParams(initialParams);
      setLoading(false);
    }
  }, [recipeId, initialParams, pollMs]);

  // Resize logic
  useEffect(() => {
    Image.getSize(
      imgSrc.uri ?? Image.resolveAssetSource(imgSrc).uri,
      (w, h) => { setNatW(w); setNatH(h); },
      () => { setNatW(contW); setNatH(contH); }
    );
  }, [imgSrc]);

  useEffect(() => {
    if (!natW || !natH) return;
    const scale = Math.min(contW / natW, contH / natH);
    setDispW(Math.round(natW * scale));
    setDispH(Math.round(natH * scale));
  }, [natW, natH, contW, contH]);

  const values = useMemo(() => {
    const m: Record<number, RecipeParam | null> = {};
    PARAM_SR.forEach(sr => (m[sr] = params.find(p => Number(p.parameter_no) === sr) ?? null));
    return m;
  }, [params]);

  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      PARAM_SR.map(sr => {
        const orig = values[sr];
        const edit = edited[sr];
        return {
          parameter_no: sr,
          section: orig?.section ?? 'FOLDS',
          parameter: orig?.parameter ?? '',
          value_01: edit ?? orig?.value_01 ?? '',
          unit: orig?.unit ?? '',
        };
      }),
  }));

  return (
  <View
    style={styles.container}
    onLayout={(e) => {
      const { width, height } = e.nativeEvent.layout;
      if (width) setContW(width);
      if (height) setContH(height);
    }}
  >
    <View style={styles.header}>
      <Text style={[styles.title, dark && { color: '#fff' }]}>
        {recipeName ?? 'Folds'}
      </Text>
      <Text style={styles.close} onPress={onClose}>Close</Text>
    </View>

    {/* CENTER WRAPPER — FIXES WHITE SPACE ISSUE */}
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ZoomableView
        minScale={1}
        maxScale={4}
        doubleTapScale={2}
        style={{ width: dispW, height: dispH }}
      >
        <ImageBackground
          source={imgSrc}
          style={{ width: dispW, height: dispH }}
          resizeMode="contain"
        >

          {loading && (
            <View style={[styles.loading, { width: dispW, height: dispH }]}>
              <ActivityIndicator size="large" />
            </View>
          )}

          {/* PARAMETER BOXES */}
          {PARAM_SR.map(sr => {
            const pos = POSITIONS[sr];
            const orig = values[sr];
            const display = edited[sr] ?? orig?.value_01 ?? '';

            const left = Math.round((pos.x / 100) * dispW);
            const top = Math.round((pos.y / 100) * dispH);

            return (
              <TouchableOpacity
                key={`p-${sr}`}
                onPress={() => { setEditingSr(sr); setTempVal(String(display)); }}
                style={[
                  styles.paramBox,
                  {
                    left,
                    top,
                    width: BOX_W,
                    height: BOX_H,
                    transform: [
                      { translateX: -BOX_W / 2 },
                      { translateY: -BOX_H / 2 },
                    ],
                  },
                ]}
              >
                <Text style={[styles.paramText, dark && { color: '#fff' }]}>
                  {display}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* SERIAL NUMBER LABELS */}
          {SERIAL_POS.map(p => {
            const left = Math.round((p.x / 100) * dispW);
            const top = Math.round((p.y / 100) * dispH);

            return (
              <View
                key={`s-${p.id}`}
                pointerEvents="none"
                style={[
                  styles.serialBox,
                  {
                    left,
                    top,
                    width: BOX_W,
                    height: BOX_H,
                    transform: [
                      { translateX: -BOX_W / 2 },
                      { translateY: -BOX_H / 2 },
                    ],
                  },
                ]}
              >
                <Text style={styles.serialText}>{p.id}</Text>
              </View>
            );
          })}

        </ImageBackground>
      </ZoomableView>
    </View>

    {/* VALUE EDITOR */}
    <Modal visible={editingSr !== null} transparent animationType="fade">
      <View style={styles.modalBg}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Edit Fold</Text>
          <TextInput
            style={styles.input}
            value={tempVal}
            onChangeText={setTempVal}
            keyboardType="numeric"
          />
          <View style={styles.row}>
            <Text onPress={() => setEditingSr(null)} style={styles.cancel}>Cancel</Text>
            <Text
              onPress={() => {
                if (editingSr !== null) {
                  setEdited({ ...edited, [editingSr]: tempVal });
                }
                setEditingSr(null);
              }}
              style={styles.save}
            >
              Save
            </Text>
          </View>
        </View>
      </View>
    </Modal>

  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 6, backgroundColor: '#f9fafb', borderRadius: 8 , overflow: 'hidden',},
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  close: { color: '#0066ff', fontWeight: '700' },

  loading: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },

  paramBox: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  paramText: { fontSize: 10, fontWeight: '700', textAlign: 'center', color: '#000' },

  serialBox: {
    position: 'absolute',
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 1.4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  serialText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 10, padding: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancel: { marginRight: 20, color: '#555' },
  save: { color: '#007bff', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
});

export default React.forwardRef(FoldsInner);
