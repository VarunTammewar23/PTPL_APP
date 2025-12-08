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

/** YOU CAN EDIT THESE */

/** Editable parameter serials */
const PARAM_SR = [2, 6, 10, 11]; // 🔁 CHANGE AS REQUIRED

/** Parameter box positions */
const POSITIONS: Record<number, { x: number; y: number }> = {
  2: { x: 58, y: 50 },
  6: { x: 31, y: 90 },
  10: { x: 90, y: 75 },
  11: { x: 55, y: 90 },
};

/** Serial number box positions */
const SERIAL_POS = [
  { id: 2, x: 58, y: 57 },
  { id: 6, x: 31, y: 82 },
  { id: 10, x: 90, y: 82 },
  { id: 11, x: 55, y: 84 },
];

/** BOX SIZE */
const BOX_W = 30;
const BOX_H = 24;

function OffsetInner(
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

  const imgSrc = imageUri ? { uri: imageUri } : require('../assets/offset.jpeg'); // 🔁 CHANGE IMAGE

  const [edited, setEdited] = useState<Record<number, string>>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState('');

  // --- Load parameters from backend ---
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

  // --- Resize ---
  useEffect(() => {
    const uri = imgSrc.uri ?? Image.resolveAssetSource(imgSrc).uri;
    Image.getSize(uri, (w, h) => { setNatW(w); setNatH(h); });
  }, [imgSrc]);

  useEffect(() => {
    if (!natW || !natH) return;
    const scale = Math.min(contW / natW, contH / natH);
    setDispW(Math.round(natW * scale));
    setDispH(Math.round(natH * scale));
  }, [natW, natH, contW, contH]);

  // --- Bind param values to serial numbers ---
  const values = useMemo(() => {
    const map: Record<number, RecipeParam | null> = {};
    PARAM_SR.forEach(sr => (map[sr] = params.find(p => Number(p.parameter_no) === sr) ?? null));
    return map;
  }, [params]);

  // --- Expose save data to backend ---
  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      PARAM_SR.map(sr => {
        const orig = values[sr];
        const edit = edited[sr];
        return {
          parameter_no: sr,
          section: orig?.section ?? 'OFFSET SETTINGS',
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
        {recipeName ?? 'Offset Settings'}
      </Text>
      <Text style={styles.close} onPress={onClose}>Close</Text>
    </View>

    {/* CENTER FIX — prevents image from shrinking */}
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ZoomableView
        minScale={1}
        maxScale={4}
        doubleTapScale={2}
        style={{ width: dispW, height: dispH }}
      >
        <ImageBackground
          source={imgSrc}
          resizeMode="contain"
          style={{ width: dispW, height: dispH }}
        >

          {loading && (
            <View style={[styles.loading, { width: dispW, height: dispH }]}>
              <ActivityIndicator size="large" />
            </View>
          )}

          {/* Editable PARAM Boxes */}
          {PARAM_SR.map(sr => {
            const pos = POSITIONS[sr];
            const left = Math.round((pos.x / 100) * dispW);
            const top = Math.round((pos.y / 100) * dispH);
            const orig = values[sr];
            const display = edited[sr] ?? orig?.value_01 ?? '';

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
                      { translateY: -BOX_H / 2 }
                    ]
                  }
                ]}
              >
                <Text style={[styles.paramText, dark && { color: '#fff' }]}>
                  {display}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Serial Numbers */}
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
                      { translateY: -BOX_H / 2 }
                    ]
                  }
                ]}
              >
                <Text style={styles.serialText}>{p.id}</Text>
              </View>
            );
          })}

        </ImageBackground>
      </ZoomableView>
    </View>

    {/* Edit Modal */}
    <Modal visible={editingSr !== null} transparent animationType="fade">
      <View style={styles.modalBg}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Edit Value</Text>

          <TextInput
            value={tempVal}
            onChangeText={setTempVal}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.row}>
            <Text style={styles.cancel} onPress={() => setEditingSr(null)}>Cancel</Text>
            <Text
              style={styles.save}
              onPress={() => {
                if (editingSr !== null) {
                  setEdited({ ...edited, [editingSr]: tempVal });
                }
                setEditingSr(null);
              }}
            >
              Save
            </Text>
          </View>
        </View>
      </View>
    </Modal>

    {/* SHOW TABLE + VIDEO BUTTONS */}
    <View style={{ position: 'absolute', right: 12, bottom: 12, flexDirection: 'row' }}>
      <TouchableOpacity
        style={{ backgroundColor: '#007bff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginLeft: 8 }}
        onPress={() => setTablePopup(true)}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>SHOW TABLE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ backgroundColor: '#28a745', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginLeft: 8 }}
        onPress={() => console.log('Video clicked')}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>VIDEO</Text>
      </TouchableOpacity>
    </View>

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
  paramText: { fontSize: 10, fontWeight: '700', color: '#000' },

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
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 },
});

export default React.forwardRef(OffsetInner);
