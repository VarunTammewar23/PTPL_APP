// src/components/GlueTap.tsx
import React, { useEffect, useMemo, useState, useImperativeHandle } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ImageBackground,
  Dimensions, Image, TouchableOpacity, Modal, TextInput
} from 'react-native';
import ZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';

const PARAM_SR = [12];  // 🔁 CHANGE SERIALS
const POSITIONS = {
  12: { x: 30, y: 55 },
};
const SERIAL_POS = [
  { id: 12, x: 30, y: 45 },
];

const BOX_W = 30, BOX_H = 24;

function GlueTapInner({ recipeId, recipeName, imageUri, onClose, initialParams, pollMs = 2000 }: any, ref: any) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [params, setParams] = useState(initialParams ?? []);
  const [loading, setLoading] = useState(!initialParams);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  const [contW, setContW] = useState(Dimensions.get('window').width);
  const [contH, setContH] = useState(Math.round(Dimensions.get('window').height * 0.45));
  const [dispW, setDispW] = useState(contW);
  const [dispH, setDispH] = useState(contH);

  const imgSrc = imageUri ? { uri: imageUri } : require('../assets/gluetap.jpeg'); // 🔁 CHANGE IMAGE

  const [edited, setEdited] = useState({});
  const [editingSr, setEditingSr] = useState(null);
  const [tempVal, setTempVal] = useState('');

  useEffect(() => {
    if (!initialParams) {
      const load = async () => {
        try {
          const res = await apiGet(`/recipes/${recipeId}`);
          setParams(res.data?.params ?? []);
        } finally {
          setLoading(false);
        }
      };
      load();
      const id = setInterval(load, pollMs);
      return () => clearInterval(id);
    }
  }, [recipeId, initialParams]);

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
    const map = {};
    PARAM_SR.forEach(sr => map[sr] = params.find(p => Number(p.parameter_no) === sr) ?? null);
    return map;
  }, [params]);

  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      PARAM_SR.map(sr => ({
        parameter_no: sr,
        section: values[sr]?.section ?? 'GLUE / TAP QTY',
        parameter: values[sr]?.parameter ?? '',
        value_01: edited[sr] ?? values[sr]?.value_01 ?? '',
        unit: values[sr]?.unit ?? '',
      })),
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
        {recipeName ?? 'Glue / Tap Qty'}
      </Text>
      <Text style={styles.close} onPress={onClose}>Close</Text>
    </View>

    {/* CENTER WRAPPER — FIXES WHITE SPACE */}
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

          {SERIAL_POS.map(s => {
            const left = (s.x / 100) * dispW;
            const top = (s.y / 100) * dispH;

            return (
              <View
                key={s.id}
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

    {/* EDIT MODAL */}
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
                setEdited({ ...edited, [editingSr!]: tempVal });
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
  title: { fontSize: 16, fontWeight: '700' },
  close: { color: '#007bff', fontWeight: '700' },
  loading: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  paramBox: { position: 'absolute', borderRadius: 6, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)' },
  paramText: { fontSize: 10, fontWeight: '700' },
  serialBox: { position: 'absolute', backgroundColor: '#000', borderColor: '#fff', borderWidth: 1.3,
    justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  serialText: { fontWeight: '700', color: '#fff', fontSize: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 18 },
  modal: { backgroundColor: '#fff', borderRadius: 10, padding: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  cancel: { color: '#666', marginRight: 20 },
  save: { color: '#007bff', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#aaa', borderRadius: 6, padding: 8 }
});

export default React.forwardRef(GlueTapInner);
