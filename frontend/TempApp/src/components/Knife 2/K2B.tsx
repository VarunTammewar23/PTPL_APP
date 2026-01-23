// src/components/Knife 1/K2B.tsx
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

/* ---------- CONFIG ---------- */

// 👉 CHANGE THESE PARAM NUMBERS LATER IF NEEDED
const PARAM_SR = [112, 113, 114, 114, 115, 115];

const POSITIONS = [
  { x: 36.65, y: 51.5 }, // 112
  { x: 27.9, y: 5 },  // 113
  { x: 45, y: 41.7 }, // 114 (first)
  { x: 61.9, y: 63.4 }, // 114 (second)
  { x: 44.9, y: 72 }, // 115 (first)
  { x: 23.8, y: 58.3 }, // 115 (second)
];


const SERIAL_POS = [
  { id: 112, x: 36.5, y: 57.5 },
  { id: 113, x: 23, y: 5 },
  { id: 114, x: 45, y: 35.5 },
  { id: 114, x: 61.8, y: 57.6 },
  { id: 115, x: 44.7, y: 78 },
  { id: 115, x: 23.7, y: 64 },
];

const BOX_W = 100;
const BOX_H = 50;

const IMG_W = 1300;
const IMG_H = 600;

/* ---------- TABLE CONFIG ---------- */

const POPUP_COLUMNS = [
  { key: 'sr', title: 'SR', width: 100 },
  { key: 'parameter', title: 'Parameter', flex: 4 },
  { key: 'orig', title: 'Original', flex: 2 },
  { key: 'changed', title: 'Changed', flex: 2 },
];



/* ---------- TYPES ---------- */

type Props = {
  recipeId: number;
  recipeName?: string;
  imageUri?: string;
  onClose?: () => void;
  initialParams?: any[];
  pollMs?: number;
  onSave?: (opts?: { mode?: 'save' | 'saveAs' }) => void;
  onParamEdit?: (param: {
    parameter_no: number;
    value_01: string | number;
    section?: string;
    parameter?: string;
    unit?: string;
  }) => void;
  onPrev?: () => void;
  onNext?: () => void;
};

interface RecipeParam {
  parameter_no: number;
  section?: string;
  parameter?: string;
  value_01?: number | string;
  unit?: string;
}

/* ---------- COMPONENT ---------- */

function K2BInner(
  { recipeId, imageUri, initialParams, pollMs = 2000, onSave, onParamEdit, onPrev, onNext }: Props,
  ref: any
) {
  const [params, setParams] = useState<RecipeParam[]>(initialParams ?? []);
  const [loading, setLoading] = useState(!initialParams);

  useEffect(() => {
    if (initialParams) {
      setParams(initialParams);
      setLoading(false);
    }
  }, [initialParams]);

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  const [contW, setContW] = useState(width);
  const [contH, setContH] = useState(Math.round(height * 0.75));

  const imgSrc = imageUri ? { uri: imageUri } : require('../../assets/KB.jpg');

  const [edited, setEdited] = useState<Record<number, string>>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState('');

  const [tablePopup, setTablePopup] = useState(false);
  const [videoPopup, setVideoPopup] = useState(false);

  /* ---------- FETCH ---------- */

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
        section: values[sr]?.section ?? 'Knife 1',
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

  /* ---------- UI ---------- */

  return (
    <View style={styles.container}>
      <View style={[styles.bodyRow, isPortrait && { flexDirection: 'column' }]}>
        {/* IMAGE */}
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
                {PARAM_SR.map((sr, index) => {
  const pos = POSITIONS[index];
  const val = edited[sr] ?? values[sr]?.value_01 ?? '';

  let cx = (pos.x / 100) * IMG_W;
  let cy = (pos.y / 100) * IMG_H;

  cx = Math.max(BOX_W / 2, Math.min(cx, IMG_W - BOX_W / 2));
  cy = Math.max(BOX_H / 2, Math.min(cy, IMG_H - BOX_H / 2));

  return (
    <TouchableOpacity
      key={`${sr}-${index}`}   // ✅ UNIQUE KEY
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
                {SERIAL_POS.map((p, index) => {
  const cx = (p.x / 100) * IMG_W;
  const cy = (p.y / 100) * IMG_H;

  return (
    <View
      key={`${p.id}-${index}`}   // ✅ UNIQUE KEY
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

          <TouchableOpacity style={styles.btnGreen} onPress={() => setVideoPopup(true)}>
            <Text style={styles.btnText}>VIDEO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnBlue} onPress={() => onSave?.({ mode: 'save' })}>
            <Text style={styles.btnText}>SAVE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnGreen} onPress={() => onSave?.({ mode: 'saveAs' })}>
            <Text style={styles.btnText}>SAVE AS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGray}
            onPress={() => onPrev?.()}
          >
            <Text style={styles.btnText}>◀ PREV</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGray}
            onPress={() => onNext?.()}
          >
            <Text style={styles.btnText}>NEXT ▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      <VideoModal visible={videoPopup} onClose={() => setVideoPopup(false)} />

      {/* EDIT MODAL */}
      <Modal visible={editingSr !== null} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalEdit}>
              <Text style={styles.modalTitle}>
                Edit Parameter No. :- {editingSr}
              </Text>
            <TextInput
              style={styles.input}
              value={tempVal}
              onChangeText={setTempVal}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
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

                  setEdited({ ...edited, [sr]: newVal });

                  onParamEdit?.({
                    parameter_no: sr,
                    value_01: newVal,
                    section: values[sr]?.section ?? 'Knife 1',
                    parameter: values[sr]?.parameter ?? '',
                    unit: values[sr]?.unit ?? '',
                  });

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
            <View style={styles.popupHeaderRow}>
              <Text style={styles.modalTitle}>Parameter Table</Text>
              <TouchableOpacity onPress={() => setTablePopup(false)} style={styles.popupCloseBtn}>
                <Text style={styles.popupCloseIcon}>✕</Text>
                <Text style={styles.popupCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.popupTable}>
              <View style={[styles.popupRow, styles.popupHeader]}>
                {POPUP_COLUMNS.map(col => (
                  <Text
                    key={col.key}
                    style={[
                      styles.popupCell,
                      col.width && { width: col.width },
                      col.flex && { flex: col.flex },
                      styles.popupHeaderText,
                    ]}
                  >
                    {col.title}
                  </Text>
                ))}
              </View>

              {PARAM_SR.map((sr, index) => {
  const orig = values[sr]?.value_01 ?? '';
  const param = values[sr]?.parameter ?? '';
  const changed = edited[sr] ?? '-';

  return (
    <View key={`${sr}-${index}`} style={styles.popupRow}>
      {POPUP_COLUMNS.map(col => {
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

  leftArea: { flex: 0.85, overflow: 'hidden' },
  rightButtons: { flex: 0.15, alignItems: 'center', paddingVertical: 10 },

  portraitButtons: { width: '100%', borderTopWidth: 1, borderColor: '#ccc' },

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
  btnGray: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 8,
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
  paramText: { fontSize: 16, fontWeight: '700' },

  serialBox: {
    position: 'absolute',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  serialText: { color: '#fff', fontWeight: '700' },

  loading: { position: 'absolute', top: '45%', left: '45%' },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
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

  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 8,
    fontSize: POPUP.EDIT.inputFont, // ✅ global control
  },

  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
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

  popupTable: { borderWidth: 1, borderColor: '#ccc' },
  popupRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc' },
  popupHeader: { backgroundColor: '#f2f2f8' },

  popupCell: { paddingVertical: 10, textAlign: 'center' },
  popupHeaderText: { fontWeight: '700', fontSize: POPUP.TABLE.headerFont },
  popupBodyText: { fontSize: POPUP.TABLE.bodyFont },

  popupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  popupCloseBtn: { flexDirection: 'row', alignItems: 'center' },
  popupCloseIcon: { fontSize: 18, fontWeight: '800', marginRight: 4 },
  popupCloseText: { fontSize: POPUP.TABLE.closeFont, fontWeight: '800' },
});

export default React.forwardRef(K2BInner);
