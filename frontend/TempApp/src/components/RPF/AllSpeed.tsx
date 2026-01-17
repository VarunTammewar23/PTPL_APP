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
import { apiGet } from '../../api/api';
import { useWindowDimensions } from 'react-native';
import VideoModal from '../VideoModal';
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '../../ui/typography';  // Typography constants
import { POPUP } from '../../ui/Popup';


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

const PARAM_SR = [15, 16, 17, 118, 102, 134];

const POSITIONS: Record<number, { x: number; y: number }> = {
  15:  { x: 71.4, y: 12.5 },
  16:  { x: 71.4, y: 34 },
  17:  { x: 71.4, y: 55 },
  118: { x: 71.4, y: 73.5 },
  102: { x: 71.4, y: 84 },
  134: { x: 71.4, y: 93.5 },
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

// Adjust the Size of table popup body fonts and titles
  const POPUP_COLUMNS = [
  { key: 'sr', title: 'SR', width: 100, align: 'center' },
  { key: 'parameter', title: 'Parameter', flex: 4, align: 'center' },
  { key: 'orig', title: 'Original', flex: 2, align: 'center' },
  { key: 'changed', title: 'Changed', flex: 2, align: 'center' },
];



/* ---------- COMPONENT ---------- */

function AllSpeedInner(
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
    : require('../../assets/allspeed.jpeg');

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
          <View style={styles.modalEdit}>

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
    const sr = editingSr!;
    const newVal = tempVal;

    // 1️⃣ Update local UI state (unchanged behavior)
    setEdited({ ...edited, [sr]: newVal });

    // 2️⃣ 🔴 REPORT EDIT TO MAINSCREEN (THIS WAS MISSING)
    onParamEdit?.({
      parameter_no: sr,
      value_01: newVal,
      section: values[sr]?.section ?? 'All Speed',
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
    <View style={styles.modalTable}>

      {/* HEADER ROW */}
      <View style={styles.popupHeaderRow}>
        <Text style={styles.modalTitle}>Parameter Table</Text>

        <TouchableOpacity
          onPress={() => setTablePopup(false)}
          style={styles.popupCloseBtn}
        >
          <Text style={styles.popupCloseIcon}>✕</Text>
          <Text style={styles.popupCloseText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* TABLE */}
      <View style={styles.popupTable}>

        {/* TABLE HEADER */}
        <View style={[styles.popupRow, styles.popupHeader]}>
          {POPUP_COLUMNS.map((col, i) => (
            <Text
              key={col.key}
              style={[
                styles.popupCell,
                col.width && { width: col.width },
                col.flex && { flex: col.flex },
                i !== POPUP_COLUMNS.length - 1 && styles.popupColBorder,
                styles.popupHeaderText,
              ]}
            >
              {col.title}
            </Text>
          ))}
        </View>

        {/* TABLE ROWS */}
        {PARAM_SR.map((sr) => {
          const orig = values[sr]?.value_01 ?? '';
          const param = values[sr]?.parameter ?? '';
          const changed = edited[sr] ?? '-';

          return (
            <View key={sr} style={styles.popupRow}>
              {POPUP_COLUMNS.map((col, i) => {
                let value: any = '';
                if (col.key === 'sr') value = sr;
                if (col.key === 'parameter') value = param;
                if (col.key === 'orig') value = orig;
                if (col.key === 'changed') value = changed;

                return (
                  <Text
                    key={col.key}
                    style={[
                      styles.popupCell,
                      styles.popupBodyText,
                      col.width && { width: col.width },
                      col.flex && { flex: col.flex },
                      i !== POPUP_COLUMNS.length - 1 && styles.popupColBorder,
                      col.key === 'changed' &&
                        changed !== '-' && { color: '#007bff' },
                    ]}
                  >
                    {value}
                  </Text>
                );
              })}
            </View>
          );
        })}
      </View>
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
    fontSize: FONT_SIZE.sidebar, 
    fontWeight: '700',
  },

  paramBox: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    zIndex: 10,
  },

  paramText: { fontSize: 24, fontWeight: '700' },

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

    input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 8,
    fontSize: POPUP.EDIT.inputFont, // ✅ global control
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },

  cancel: {
    marginRight: 20,
    color: '#666',
    fontSize: 18,

  },
  save: {
    color: '#007bff',
    fontWeight: '700',
    fontSize: 18,
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

modalEdit: {
  backgroundColor: '#fff',
  padding: POPUP.EDIT.padding ?? 12,
  borderRadius: POPUP.EDIT.borderRadius ?? 10,
  width: POPUP.EDIT.width,
  alignSelf: 'center',
},

modalTable: {
  backgroundColor: '#fff',
  padding: POPUP.TABLE.padding ?? 12,
  borderRadius: POPUP.TABLE.borderRadius ?? 10,
  width: POPUP.TABLE.width,
  maxHeight: POPUP.TABLE.maxHeight,
  alignSelf: 'center',
},

modalTitle: {
  fontSize: POPUP.TABLE.titleFont,
  fontWeight: '700',
  marginBottom: 10,
},

popupTable: {
  borderWidth: 1,
  borderColor: '#ccc',
},

popupRow: {
  flexDirection: 'row',
  borderBottomWidth: 1,
  borderColor: '#ccc',
},

popupHeader: {
  backgroundColor: '#f2f2f8',
},

popupCell: {
  paddingVertical: 10,
  textAlign: 'center',
},

popupColBorder: {
  borderRightWidth: 1,
  borderColor: '#ccc',
},

popupHeaderText: {
  fontWeight: '700',
  fontSize: POPUP.TABLE.headerFont,
},

popupBodyText: {
  fontSize: POPUP.TABLE.bodyFont,
},

popupHeaderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
},

popupCloseBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 6,
  paddingVertical: 4,
},

popupCloseIcon: {
  fontSize: 18,
  fontWeight: '800',
  color: '#444',
  marginRight: 4,
},

popupCloseText: {
  fontSize: POPUP.TABLE.closeFont,
  fontWeight: '800',
  color: '#444',
  paddingLeft: 5,
},

});

export default React.forwardRef(AllSpeedInner);
