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
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';
import { useWindowDimensions } from 'react-native';

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
  const [contH, setContH] = useState(Math.round(Dimensions.get('window').height * 0.75));


  const [dispW, setDispW] = useState(contW);
  const [dispH, setDispH] = useState(contH);

  const imgSrc = imageUri ? { uri: imageUri } : require('../assets/folds.jpeg');

  const [edited, setEdited] = useState<Record<number, string>>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState('');

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
    clearEdits: () => {
      setEdited({});
      setEditingSr(null);
      setTempVal('');
    }
  }));

  const [tablePopup, setTablePopup] = useState(false);
  // Detect orientation
const { width, height } = useWindowDimensions();
const isPortrait = height > width;


  return (
    <View style={styles.container}>

      {/* MAIN LAYOUT: LEFT 85% IMAGE, RIGHT 15% BUTTONS */}
      <View style={[styles.bodyRow, isPortrait && { flexDirection: 'column' }]}>
        
        {/* LEFT SIDE IMAGE */}
          <View
            style={styles.leftArea}
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout;
              if (width) setContW(width);
            }}
          >
          <ZoomableView
            minScale={1}
            maxScale={4}
            doubleTapScale={2}
            bindToBorders={true}
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
                const val = edited[sr] ?? values[sr]?.value_01 ?? '';
                const left = Math.round((pos.x / 100) * dispW);
                const top = Math.round((pos.y / 100) * dispH);
                return (
                  <TouchableOpacity
                    key={`p-${sr}`}
                    onPress={() => { setEditingSr(sr); setTempVal(String(val)); }}
                    style={[styles.paramBox, {
                      left,
                      top,
                      width: BOX_W,
                      height: BOX_H,
                      transform: [{ translateX: -BOX_W / 2 }, { translateY: -BOX_H / 2 }],
                    }]}
                  >
                    <Text style={[styles.paramText, dark && { color: '#fff' }]}>{val}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* SERIAL NUMBERS */}
              {SERIAL_POS.map(p => {
                return (
                  <View
                    key={`s-${p.id}`}
                    pointerEvents="none"
                    style={[styles.serialBox, {
                      left: Math.round((p.x / 100) * dispW),
                      top: Math.round((p.y / 100) * dispH),
                      width: BOX_W,
                      height: BOX_H,
                      transform: [{ translateX: -BOX_W / 2 }, { translateY: -BOX_H / 2 }],
                    }]}
                  >
                    <Text style={styles.serialText}>{p.id}</Text>
                  </View>
                );
              })}

            </ImageBackground>
          </ZoomableView>
        </View>

        {/* RIGHT SIDE BUTTON AREA */}
<View style={[
  styles.rightButtons,
  isPortrait && styles.portraitButtons
]}>

          <TouchableOpacity style={styles.btnBlue} onPress={() => setTablePopup(true)}>
            <Text style={styles.btnText}>SHOW TABLE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnGreen} onPress={() => console.log('Video clicked')}>
            <Text style={styles.btnText}>VIDEO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnBlue} onPress={() => console.log('Save clicked')}>
            <Text style={styles.btnText}>SAVE</Text>
          </TouchableOpacity>
        </View>

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

      {/* TABLE POPUP */}
      <Modal visible={tablePopup} animationType="fade" transparent onRequestClose={() => setTablePopup(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '92%', maxWidth: 720, backgroundColor: '#fff', borderRadius: 10, padding: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Parameter Table</Text>
            <View style={{ flexDirection: 'row', backgroundColor: '#e8e8f5', padding: 6 }}>
              <Text style={{ flex: 0.7, textAlign: 'center', fontWeight: '700' }}>SR</Text>
              <Text style={{ flex: 2, textAlign: 'center', fontWeight: '700' }}>Parameter</Text>
              <Text style={{ flex: 1.3, textAlign: 'center', fontWeight: '700' }}>Original</Text>
              <Text style={{ flex: 1.3, textAlign: 'center', fontWeight: '700' }}>Changed</Text>
            </View>
            {PARAM_SR.map(sr => {
              const orig = values[sr]?.value_01 ?? '';
              const paramName = values[sr]?.parameter ?? '';
              const changed = edited[sr] ?? '';
              return (
                <View key={`tbl-${sr}`} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
                  <Text style={{ flex: 0.7, textAlign: 'center' }}>{sr}</Text>
                  <Text style={{ flex: 2, textAlign: 'center' }}>{paramName}</Text>
                  <Text style={{ flex: 1.3, textAlign: 'center' }}>{orig}</Text>
                  <Text style={{ flex: 1.3, textAlign: 'center', color: changed ? 'blue' : '#111' }}>{changed || '-'}</Text>
                </View>
              );
            })}

            <TouchableOpacity onPress={() => setTablePopup(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: '#007bff', fontWeight: '700', textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 6, backgroundColor: '#f9fafb', borderRadius: 8, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  close: { color: '#0066ff', fontWeight: '700', position: 'absolute', right: 0 },
  loading: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },

  bodyRow: { flex: 1, flexDirection: 'row' },

  leftArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderRadius: 6
  },

  rightButtons: {
    flex: 0.15,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    backgroundColor: '#eef3ff',
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
  },

  btnBlue: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    width: '90%',
    marginTop: 10,
  },
  btnGreen: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    width: '90%',
    marginTop: 10,
  },
  btnText: { color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: '700' },

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

  portraitButtons: {
  width: '100%',
  borderLeftWidth: 0,
  borderTopWidth: 1,
  borderTopColor: '#ccc',
  marginTop: 6,
  paddingVertical: 10,
},

});

export default React.forwardRef(FoldsInner);
