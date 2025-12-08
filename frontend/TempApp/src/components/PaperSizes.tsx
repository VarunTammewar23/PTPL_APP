// src/components/MachinePanel.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import ZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';
import { useWindowDimensions } from 'react-native';

const PARAM_SR = [1, 2, 3, 4, 5, 6];

const POSITIONS = {
  1: { x: 62, y: 63 },
  2: { x: 16, y: 57 },
  3: { x: 24, y: 18.5 },
  4: { x: 23, y: 7.5 },
  5: { x: 85, y: 90 },
  6: { x: 83, y: 58 },
};

const SERIAL_POS = [
  { id: 1, x: 62, y: 71 },
  { id: 2, x: 16, y: 63 },
  { id: 3, x: 19, y: 26 },
  { id: 4, x: 30, y: 7.5 },
  { id: 5, x: 85, y: 98 },
  { id: 6, x: 83, y: 53 },
];

const BOX_W = 50,
  BOX_H = 30;

function MachinePanelInner(
  { recipeId, imageUri, onClose, initialParams, pollMs = 2000, onSave }: any,
  ref: any
) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [params, setParams] = useState(initialParams ?? []);
  const [loading, setLoading] = useState(!initialParams);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  const [contW, setContW] = useState(width);
  const [contH, setContH] = useState(Math.round(height * 0.75));

  const [dispW, setDispW] = useState(contW);
  const [dispH, setDispH] = useState(contH);

  const imgSrc = imageUri
    ? { uri: imageUri }
    : require('../assets/Paper_size.jpg');

  const [edited, setEdited] = useState({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState('');

  // fetch params
  useEffect(() => {
    if (initialParams) return;
    const fetchData = async () => {
      const res = await apiGet(`/recipes/${recipeId}`);
      setParams(res.data?.params ?? []);
      setLoading(false);
    };
    fetchData();
    const id = setInterval(fetchData, pollMs);
    return () => clearInterval(id);
  }, [recipeId, pollMs]);

  // get image natural size
  useEffect(() => {
    try {
      const resolved = ImageBackground.resolveAssetSource
        ? ImageBackground.resolveAssetSource(imgSrc)
        : imgSrc;
      setNatW(resolved.width);
      setNatH(resolved.height);
    } catch {}
  }, [imgSrc]);

  // scale image
  useEffect(() => {
    if (!natW || !natH) return;
    const scale = Math.min(contW / natW, contH / natH);
    setDispW(Math.round(natW * scale));
    setDispH(Math.round(natH * scale));
  }, [natW, natH, contW, contH]);

  const values = useMemo(() => {
    const m: any = {};
    PARAM_SR.forEach(
      (sr) => (m[sr] = params.find((p) => Number(p.parameter_no) === sr) ?? null)
    );
    return m;
  }, [params]);

  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      PARAM_SR.map((sr) => ({
        parameter_no: sr,
        section: values[sr]?.section ?? 'PAPER SIZES',
        parameter: values[sr]?.parameter ?? '',
        value_01: edited[sr] ?? values[sr]?.value_01 ?? '',
        unit: values[sr]?.unit ?? '',
      })),
    clearEdits: () => {
      setEdited({});
      setEditingSr(null);
      setTempVal('');
    },
  }));

  const [tablePopup, setTablePopup] = useState(false);

  return (
    <View style={styles.container}>
      {/* HEADER */}

      {/* BODY */}
      <View
        style={[styles.bodyRow, isPortrait && { flexDirection: 'column' }]}
      >
        {/* IMAGE AREA */}
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
            bindToBorders
            style={{ width: dispW, height: dispH }}
          >
            <ImageBackground
              source={imgSrc}
              style={{ width: dispW, height: dispH }}
              resizeMode="contain"
            >
              {loading && (
                <View
                  style={[styles.loading, { width: dispW, height: dispH }]}
                >
                  <ActivityIndicator size="large" />
                </View>
              )}

              {/* PARAM BOXES */}
              {PARAM_SR.map((sr) => {
                const pos = POSITIONS[sr];
                const val = edited[sr] ?? values[sr]?.value_01 ?? '';
                const left = Math.round((pos.x / 100) * dispW);
                const top = Math.round((pos.y / 100) * dispH);

                return (
                  <TouchableOpacity
                    key={sr}
                    onPress={() => {
                      setEditingSr(sr);
                      setTempVal(String(val));
                    }}
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
                      {val}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* SERIAL BOXES */}
              {SERIAL_POS.map((p) => {
                const left = Math.round((p.x / 100) * dispW);
                const top = Math.round((p.y / 100) * dispH);

                return (
                  <View
                    key={p.id}
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

        {/* BUTTONS AREA */}
        <View
          style={[
            styles.rightButtons,
            isPortrait && styles.portraitButtons,
          ]}
        >
          <TouchableOpacity
            style={styles.btnBlue}
            onPress={() => setTablePopup(true)}
          >
            <Text style={styles.btnText}>SHOW TABLE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnGreen}>
            <Text style={styles.btnText}>VIDEO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnBlue}
            onPress={() => {
              const params = ref?.current?.getFinalParams?.() ?? [];
              onSave(params);
            }}
          >
            <Text style={styles.btnText}>SAVE</Text>
          </TouchableOpacity>


        </View>
      </View>

      {/* VALUE EDITOR */}
      <Modal visible={editingSr !== null} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Value</Text>
            <TextInput
              style={styles.input}
              value={tempVal}
              onChangeText={setTempVal}
              keyboardType="numeric"
            />
            <View style={styles.row}>
              <Text
                onPress={() => setEditingSr(null)}
                style={styles.cancel}
              >
                Cancel
              </Text>
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

      {/* TABLE POPUP */}
      <Modal visible={tablePopup} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Parameter Table</Text>

            <View style={styles.tblHead}>
              <Text style={styles.th}>SR</Text>
              <Text style={styles.th}>Parameter</Text>
              <Text style={styles.th}>Original</Text>
              <Text style={styles.th}>Changed</Text>
            </View>

            {PARAM_SR.map((sr) => {
              const orig = values[sr]?.value_01 ?? '';
              const param = values[sr]?.parameter ?? '';
              const changed = edited[sr] ?? '-';

              return (
                <View style={styles.tblRow} key={sr}>
                  <Text style={styles.td}>{sr}</Text>
                  <Text style={styles.td}>{param}</Text>
                  <Text style={styles.td}>{orig}</Text>
                  <Text
                    style={[
                      styles.td,
                      { color: changed !== '-' ? 'blue' : '#111' },
                    ]}
                  >
                    {changed}
                  </Text>
                </View>
              );
            })}

            <TouchableOpacity onPress={() => setTablePopup(false)}>
              <Text style={styles.save}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  close: {
    color: '#0066ff',
    fontWeight: '700',
    position: 'absolute',
    right: 0,
  },

  bodyRow: { flex: 1, flexDirection: 'row' },

  leftArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderRadius: 6,
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

  portraitButtons: {
    width: '100%',
    borderLeftWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginTop: 6,
    paddingVertical: 10,
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
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },

  loading: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },

  paramBox: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  paramText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },

  serialBox: {
    position: 'absolute',
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 1.3,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  serialText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  modalBg: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 8,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  cancel: {
    marginRight: 20,
    color: '#666',
  },
  save: {
    color: '#007bff',
    fontWeight: '700',
  },

  tblHead: {
    flexDirection: 'row',
    backgroundColor: '#e8e8f5',
    padding: 6,
  },
  th: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  tblRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  td: {
    flex: 1,
    textAlign: 'center',
  },
});

export default React.forwardRef(MachinePanelInner);
