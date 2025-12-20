// src/components/RollerGap.tsx
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
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import ZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { apiGet } from '../api/api';
import { useWindowDimensions } from 'react-native';
import VideoModal from './VideoModal';
import { ScrollView } from 'react-native';


type Props = {
  recipeId: number;
  recipeName?: string;
  imageUri?: string;
  onClose?: () => void;
  initialParams?: any[];
  pollMs?: number;
  onSave?: (params: any[]) => void;
  onParamEdit?: (param: {
    parameter_no: number;
    value_01: string | number;
    section?: string;
    parameter?: string;
    unit?: string;
  }) => void;
};

interface RecipeParam {
  parameter_no: number;
  section?: string;
  parameter?: string;
  value_01?: number | string;
  unit?: string;
}

/* ---------- CONFIG ---------- */

const PARAM_SR = [58,83,81,79,77,75,73,71,69,67,65,63,61,60,62,64,66,68,70,72,74,76,78,80,82,84];

const POSITIONS: Record<number, { x: number; y: number }> = {
  58: { x: 23, y: 60.1 },
  83: { x: 24.5, y: 54.8 },
  81: { x: 27, y: 49.5 },
  79: { x: 29.5, y: 44 },
  77: { x: 31.5, y: 38.3 },
  75: { x: 33, y: 33 },
  73: { x: 35.5, y: 27 },
  71: { x: 37.5, y: 22 },
  69: { x: 39, y: 16.5 },
  67: { x: 41.5, y: 10.5 },
  65: { x: 44.5, y: 6 },
  63: { x: 50.5, y: 6 },
  61: { x: 56, y: 6 },
  60: { x: 67.5, y: 5 },
  62: { x: 75, y: 33.3 },
  64: { x: 74, y: 38.5 },
  66: { x: 71.5, y: 44 },
  68: { x: 69.3, y: 49.5 },
  70: { x: 67.3, y: 54.5 },
  72: { x: 65.4, y: 60 },
  74: { x: 63, y: 65 },
  76: { x: 60.4, y: 71 },
  78: { x: 58, y: 76.4 },
  80: { x: 56, y: 82 },
  82: { x: 53.9, y: 87.5 },
  84: { x: 51.5, y: 92.8 },
};

const SERIAL_POS = [
  { id: 58, x: 16, y: 61 },
  { id: 83, x: 16, y: 55.5 },
  { id: 81, x: 18, y: 50.2 },
  { id: 79, x: 20, y: 45 },
  { id: 77, x: 22, y: 39.2 },
  { id: 75, x: 24, y: 33.5 },
  { id: 73, x: 26, y: 27 },
  { id: 71, x: 29, y: 22 },
  { id: 69, x: 31, y: 16 },
  { id: 67, x: 33, y: 10.5 },
  { id: 65, x: 37, y: 6 },
  { id: 63, x: 47, y: 1 },
  { id: 61, x: 60, y: 1 },
  { id: 60, x: 75, y: 5 },
  { id: 62, x: 82, y: 33 },
  { id: 64, x: 81, y: 38.5 },
  { id: 66, x: 80, y: 43.6 },
  { id: 68, x: 78, y: 49 },
  { id: 70, x: 76, y: 54.5 },
  { id: 72, x: 74, y: 60 },
  { id: 74, x: 72, y: 65 },
  { id: 76, x: 70, y: 71 },
  { id: 78, x: 68, y: 74.6 },
  { id: 80, x: 66, y: 82 },
  { id: 82, x: 64, y: 87.5 },
  { id: 84, x: 62, y: 92.8 },
];



const BOX_W = 80;
const BOX_H = 45;

const IMG_W = 1300;
const IMG_H = 600;

/* ---------- COMPONENT ---------- */

function RollerGapInner(
  { recipeId, imageUri, initialParams, pollMs = 2000, onSave, onParamEdit, }: Props,
  ref: any
) {
  const [params, setParams] = useState<RecipeParam[]>(initialParams ?? []);

useEffect(() => {
  if (initialParams) {
    setParams(initialParams);
  }
}, [initialParams]);


  const [loading, setLoading] = useState(!initialParams);

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  const [contW, setContW] = useState(width);
  const [contH, setContH] = useState(Math.round(height * 0.75));

  const imgSrc = imageUri
    ? { uri: imageUri }
    : require('../assets/rollergap.jpeg');

  const [edited, setEdited] = useState<Record<number, string>>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState('');

  /* ---------- FETCH PARAMS ---------- */

  useEffect(() => {
    if (initialParams) return;

    const fetchData = async () => {
      try {
        const res = await apiGet(`/recipes/${recipeId}`);
        setParams(res.data?.params ?? []);
      } catch {}
      setLoading(false);
    };

    fetchData();
    const id = setInterval(fetchData, pollMs);
    return () => clearInterval(id);
  }, [recipeId, pollMs]);

  /* ---------- MAP VALUES ---------- */

  const values = useMemo(() => {
    const m: Record<number, RecipeParam | null> = {};
    PARAM_SR.forEach(
      sr => (m[sr] = params.find(p => Number(p.parameter_no) === sr) ?? null)
    );
    return m;
  }, [params]);

  /* ---------- REF API ---------- */

  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      PARAM_SR.map(sr => ({
        parameter_no: sr,
        section: values[sr]?.section ?? 'ROLLER GAP',
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
  const [videoPopup, setVideoPopup] = useState(false);

  /* ---------- UI ---------- */

  return (
    <View style={styles.container}>
      <View style={[styles.bodyRow, isPortrait && { flexDirection: 'column' }]}>
        {/* IMAGE AREA */}
        <View
          style={styles.leftArea}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            if (width) setContW(width);
            if (height) setContH(height);
          }}
        >
          <ZoomableView
            minScale={1}
            maxScale={4}
            doubleTapScale={2}
            bindToBorders
            style={{ width: contW, height: contH }}
          >
            <View
              style={{
                width: contW,
                height: contH,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageBackground
                source={imgSrc}
                style={{ width: IMG_W, height: IMG_H }}
                resizeMode="contain"
              >
                {loading && (
                  <View style={styles.loading}>
                    <ActivityIndicator size="large" />
                  </View>
                )}

                {/* PARAM BOXES */}
                {PARAM_SR.map(sr => {
                  const pos = POSITIONS[sr];
                  const val = edited[sr] ?? values[sr]?.value_01 ?? '';

                  let cx = (pos.x / 100) * IMG_W;
                  let cy = (pos.y / 100) * IMG_H;

                  cx = Math.max(BOX_W / 2, Math.min(cx, IMG_W - BOX_W / 2));
                  cy = Math.max(BOX_H / 2, Math.min(cy, IMG_H - BOX_H / 2));

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
                          left: cx,
                          top: cy,
                          width: BOX_W,
                          height: BOX_H,
                          transform: [
                            { translateX: -BOX_W / 2 },
                            { translateY: -BOX_H / 2 },
                          ],
                        },
                      ]}
                    >
                      <Text style={styles.paramText}>{val}</Text>
                    </TouchableOpacity>
                  );
                })}

                {/* SERIAL NUMBERS */}
                {SERIAL_POS.map(p => {
                  const cx = (p.x / 100) * IMG_W;
                  const cy = (p.y / 100) * IMG_H;

                  return (
                    <View
                      key={p.id}
                      pointerEvents="none"
                      style={[
                        styles.serialBox,
                        {
                          left: cx,
                          top: cy,
                          width: 50,
                          height: 30,
                          transform: [
                            { translateX: -25 },
                            { translateY: -15 },
                          ],
                        },
                      ]}
                    >
                      <Text style={styles.serialText}>{p.id}</Text>
                    </View>
                  );
                })}
              </ImageBackground>
            </View>
          </ZoomableView>
        </View>

        {/* BUTTONS */}
        <View style={[styles.rightButtons, isPortrait && styles.portraitButtons]}>
          <TouchableOpacity style={styles.btnBlue} onPress={() => setTablePopup(true)}>
            <Text style={styles.btnText}>SHOW TABLE</Text>
          </TouchableOpacity>

          <TouchableOpacity
  style={styles.btnGreen}
  onPress={() => setVideoPopup(true)}
>
  <Text style={styles.btnText}>VIDEO</Text>
</TouchableOpacity>


          <TouchableOpacity
  style={styles.btnBlue}
  onPress={() => onSave?.({ mode: 'save' })}
>
  <Text style={styles.btnText}>SAVE</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.btnGreen}
  onPress={() => onSave?.({ mode: 'saveAs' })}
>
  <Text style={styles.btnText}>SAVE AS</Text>
</TouchableOpacity>

        </View>
      </View>

      <VideoModal
  visible={videoPopup}
  onClose={() => setVideoPopup(false)}
/>


      {/* EDIT MODAL */}
      <Modal visible={editingSr !== null} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Roller Gap</Text>
            <TextInput
              style={styles.input}
              value={tempVal}
              onChangeText={setTempVal}
              keyboardType="numeric"
            />
            <View style={styles.row}>
              <Text onPress={() => setEditingSr(null)} style={styles.cancel}>
                Cancel
              </Text>
              <Text
  style={styles.save}
  onPress={() => {
    const sr = editingSr!;
    const newVal = tempVal;

    // 1️⃣ Update local UI state (unchanged behavior)
    setEdited({ ...edited, [sr]: newVal });

    // 2️⃣ 🔴 REPORT EDIT TO MAINSCREEN (THIS WAS MISSING)
    onParamEdit?.({
      parameter_no: sr,
      value_01: newVal,
      section: values[sr]?.section ?? 'RollerGap',
      parameter: values[sr]?.parameter ?? '',
      unit: values[sr]?.unit ?? '',
    });

    // 3️⃣ Close editor
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
    <View style={[styles.modal, { maxHeight: '80%' }]}>

      <Text style={styles.modalTitle}>Parameter Table</Text>

      <View style={styles.tblHead}>
        <Text style={styles.th}>SR</Text>
        <Text style={styles.th}>Parameter</Text>
        <Text style={styles.th}>Original</Text>
        <Text style={styles.th}>Changed</Text>
      </View>

      <ScrollView>
        {PARAM_SR.map((sr) => {
          const param = values[sr]?.parameter ?? '';
          const orig = values[sr]?.value_01 ?? '';
          const changed = edited[sr] ?? '-';

          return (
            <View style={styles.tblRow} key={sr}>
              <Text style={styles.td}>{sr}</Text>
              <Text style={styles.td}>{param}</Text>
              <Text style={styles.td}>{orig}</Text>
              <Text
                style={[
                  styles.td,
                  { color: changed !== '-' ? '#007bff' : '#111' },
                ]}
              >
                {changed}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity onPress={() => setTablePopup(false)}>
        <Text style={[styles.save, { textAlign: 'center', marginTop: 10 }]}>
          Close
        </Text>
      </TouchableOpacity>

    </View>
  </View>
</Modal>

    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  bodyRow: { flex: 1, flexDirection: 'row' },

  leftArea: {
    flex: 0.85,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  rightButtons: {
    flex: 0.15,
    alignItems: 'center',
    paddingVertical: 10,
  },

  portraitButtons: {
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },

  btnBlue: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 6,
    width: '90%',
    marginTop: 10,
  },

  btnGreen: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 6,
    width: '90%',
    marginTop: 10,
  },

  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },

  paramBox: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    zIndex: 10,
  },

  paramText: { fontSize: 27, fontWeight: '700' },

  serialBox: {
    position: 'absolute',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },

  serialText: { color: '#fff', fontWeight: '700' },

  loading: {
    position: 'absolute',
    top: '45%',
    left: '45%',
  },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
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

  cancel: { marginRight: 20, color: '#666' },
  save: { color: '#007bff', fontWeight: '700' },

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

export default React.forwardRef(RollerGapInner);
