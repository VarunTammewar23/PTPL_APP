// src/components/SuctionGap.tsx
import React, { useEffect, useMemo, useState, useImperativeHandle } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ImageBackground,
  Dimensions, Image, TouchableOpacity, Modal, TextInput
} from 'react-native';
import ZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';

const PARAM_SR = [1, 13, 14]; // 🔁 CHANGE
const POSITIONS = {
  1: { x: 55, y: 72 },
  13: { x: 72, y: 53 },
  14: { x: 10, y: 38 },
};
const SERIAL_POS = [
  { id: 1, x: 55, y: 80 },
  { id: 13, x: 72, y: 62 },
  { id: 14, x: 5, y: 48 },
];

const BOX_W = 30, BOX_H = 24;

function SuctionGapInner({ recipeId, recipeName, imageUri, onClose, initialParams, pollMs = 2000 }: any, ref: any) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [params, setParams] = useState(initialParams ?? []);
  const [loading, setLoading] = useState(!initialParams);
  const [natW, setNatW] = useState(null); const [natH, setNatH] = useState(null);
  const [contW, setContW] = useState(Dimensions.get('window').width);
  const [contH, setContH] = useState(Math.round(Dimensions.get('window').height * 0.45));
  const [dispW, setDispW] = useState(contW), [dispH, setDispH] = useState(contH);

  const imgSrc = imageUri ? { uri: imageUri } : require('../assets/suctiongap.jpeg'); // 🔁 IMAGE

  const [edited, setEdited] = useState({});
  const [editingSr, setEditingSr] = useState(null);
  const [tempVal, setTempVal] = useState('');

  useEffect(() => {
    if (!initialParams) {
      const load = async () => {
        const res = await apiGet(`/recipes/${recipeId}`);
        setParams(res.data?.params ?? []);
        setLoading(false);
      };
      load();
      const id = setInterval(load, pollMs);
      return () => clearInterval(id);
    }
  }, [recipeId]);

  useEffect(() => {
    const uri = imgSrc.uri ?? Image.resolveAssetSource(imgSrc).uri;
    Image.getSize(uri, (w, h) => { setNatW(w); setNatH(h); });
  }, [imgSrc]);

  useEffect(() => {
    if (!natW || !natH) return;
    const sc = Math.min(contW / natW, contH / natH);
    setDispW(natW * sc); setDispH(natH * sc);
  }, [natW, natH, contW, contH]);

  const values = useMemo(() => {
    const m = {};
    PARAM_SR.forEach(sr => m[sr] = params.find(p => Number(p.parameter_no) === sr) ?? null);
    return m;
  }, [params]);

  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      PARAM_SR.map(sr => ({
        parameter_no: sr,
        section: values[sr]?.section ?? 'SUCTION / GAP SET',
        parameter: values[sr]?.parameter ?? '',
        value_01: edited[sr] ?? values[sr]?.value_01 ?? '',
        unit: values[sr]?.unit ?? '',
      })),
    clearEdits: () => {
      // edited is an object keyed by sr
      setEdited({});
      setEditingSr(null);
      setTempVal('');
    }
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
        {recipeName ?? 'Suction / Gap Set'}
      </Text>
      <Text style={styles.close} onPress={onClose}>Close</Text>
    </View>

    {/* Center wrapper to prevent image shrinking */}
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

          {/* Editable Values */}
          {PARAM_SR.map(sr => {
            const pos = POSITIONS[sr];
            const val = edited[sr] ?? values[sr]?.value_01 ?? '';
            const left = (pos.x / 100) * dispW;
            const top = (pos.y / 100) * dispH;

            return (
              <TouchableOpacity
                key={sr}
                onPress={() => { setEditingSr(sr); setTempVal(String(val)); }}
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
                  {val}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Serial Number Labels */}
          {SERIAL_POS.map(s => {
            const left = (s.x / 100) * dispW;
            const top = (s.y / 100) * dispH;

            return (
              <View
                key={`s-${s.id}`}
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
                <Text style={styles.serialText}>{s.id}</Text>
              </View>
            );
          })}

        </ImageBackground>
      </ZoomableView>
    </View>

    {/* Value Edit Modal */}
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

  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 6, backgroundColor: '#f9fafb', borderRadius: 8, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700' },
  close: { fontWeight: '700', color: '#007bff' },
  loading: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  paramBox: { position: 'absolute', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6 },
  paramText: { fontSize: 10, fontWeight: '700' },
  serialBox: { position: 'absolute', backgroundColor: '#000', borderWidth: 1.3,
    borderColor: '#fff', justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  serialText: { fontWeight: '700', color: '#fff', fontSize: 10 },
  modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 18 },
  modal: { backgroundColor: '#fff', borderRadius: 10, padding: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  cancel: { marginRight: 20, color: '#666' },
  save: { color: '#007bff', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#aaa', borderRadius: 6, padding: 8 },
});

export default React.forwardRef(SuctionGapInner);
