// src/components/AllSpeed.tsx
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

type Props = {
  recipeId: number;
  recipeName?: string;
  imageUri?: string;
  onClose?: () => void;
  initialParams?: any[];
  pollMs?: number;
  onSave?: (params: any[]) => void;
};

interface RecipeParam {
  parameter_no: number;
  section?: string;
  parameter?: string;
  value_01?: number | string;
  unit?: string;
}

/* ---------- CONFIG ---------- */

const PARAM_SR = [15, 16, 17, 118, 102, 134];

const POSITIONS: Record<number, { x: number; y: number }> = {
  15:  { x: 71, y: 13 },
  16:  { x: 71, y: 34 },
  17:  { x: 71, y: 55 },
  118: { x: 71, y: 73 },
  102: { x: 71, y: 84 },
  134: { x: 71, y: 93 },
};

const SERIAL_POS = [
  { id: 15,  x: 65,  y: 13 },
  { id: 16,  x: 65,  y: 34 },
  { id: 17,  x: 65,  y: 55 },
  { id: 118, x: 60, y: 73 },
  { id: 102, x: 60, y: 84 },
  { id: 134, x: 60, y: 93 },
];

const BOX_W = 80;
const BOX_H = 50;

const IMG_W = 1300;
const IMG_H = 600;

/* ---------- COMPONENT ---------- */

function AllSpeedInner(
  { recipeId, imageUri, initialParams, pollMs = 2000, onSave }: Props,
  ref: any
) {
  const [params, setParams] = useState<RecipeParam[]>(initialParams ?? []);
  const [loading, setLoading] = useState(!initialParams);

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  const [contW, setContW] = useState(width);
  const [contH, setContH] = useState(Math.round(height * 0.75));

  const imgSrc = imageUri
    ? { uri: imageUri }
    : require('../assets/allspeed.jpeg');

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
        section: values[sr]?.section ?? 'ALL SPEED',
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
            onPress={() => {
              const params = ref?.current?.getFinalParams?.() ?? [];
              onSave?.(params);
            }}
          >
            <Text style={styles.btnText}>SAVE</Text>
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
            <Text style={styles.modalTitle}>Edit Speed</Text>
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

  paramText: { fontSize: 28, fontWeight: '700' },

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

export default React.forwardRef(AllSpeedInner);
