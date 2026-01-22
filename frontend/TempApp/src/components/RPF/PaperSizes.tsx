// src/components/PaperSizes.tsx
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
import { useTheme } from '../../ui/ThemeProvider';
import { apiGet } from '../../api/api';
import { useWindowDimensions } from 'react-native';
import VideoModal from '../VideoModal';
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '../../ui/typography';  // Typography constants
import { POPUP } from '../../ui/Popup';
import { s, fs, clamp } from '../../ui/scale';




const PARAM_SR = [1, 2, 3, 4, 5, 6];

const POSITIONS = {
  1: { x: 61, y: 61.5 },
  2: { x: 16.5, y: 54.5 },
  3: { x: 24.9, y: 18.5 },
  4: { x: 24, y: 7 },
  5: { x: 84.1, y: 87.3 },
  6: { x: 83, y: 56.5 },
};

const SERIAL_POS = [
  { id: 1, x: 61.5, y: 70.5 },
  { id: 2, x: 17.5, y: 63 },
  { id: 3, x: 20.5, y: 26.5 },
  { id: 4, x: 33.2, y: 7.5 },
  { id: 5, x: 85.5, y: 95.3 },
  { id: 6, x: 84.7, y: 52.5 },
];

const BOX_W = clamp(s(125), 90, 140);
const BOX_H = clamp(s(50), 38, 56);


const PARAM_FONT_SIZES: Record<number, number> = {
  1: 26,
  2: 26,
  3: 34,   // 👈 bigger
  4: 28,
  5: 22,   // 👈 smaller
  6: 22,   // 👈 smaller
};


 
  // Adjust the Size of table popup body fonts and titles
  const POPUP_COLUMNS = [
  { key: 'sr', title: 'SR', width: 100, align: 'center' },
  { key: 'parameter', title: 'Parameter', flex: 4, align: 'center' },
  { key: 'orig', title: 'Original', flex: 2, align: 'center' },
  { key: 'changed', title: 'Changed', flex: 2, align: 'center' },
];






type Props = {
  recipeId: number;
  recipeName?: string;
  imageUri?: string;
  onClose?: () => void;
  initialParams?: any[];
  pollMs?: number;
  onSave?: (opts?: { mode?: 'save' | 'saveAs' }) => Promise<boolean> | void;

  onParamEdit?: (param: {
    parameter_no: number;
    value_01: string | number;
    section?: string;
    parameter?: string;
    unit?: string;
  }) => void;

  // ✅ THESE MUST BE TOP-LEVEL PROPS
  onPrev?: () => void;
  onNext?: () => void;
};



function MachinePanelInner(
  {
    recipeId,
    imageUri,
    onClose,
    initialParams,
    pollMs = 2000,
    onSave,
    onParamEdit,
    onPrev,
    onNext,
  }: Props,
  ref: React.Ref<any>
) {


  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [params, setParams] = useState(initialParams ?? []);

  useEffect(() => {
    if (initialParams) {
      setParams(initialParams);
      setLoading(false);
    }
  }, [initialParams]);


  const [loading, setLoading] = useState(!initialParams);
  const [videoPopup, setVideoPopup] = useState(false);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);

  const { width: screenW, height: screenH } = useWindowDimensions();
  const isPortrait = screenH > screenW;

  const [contW, setContW] = useState(screenW);
  const [contH, setContH] = useState(Math.round(screenH * 0.75));

  const [dispW, setDispW] = useState(contW);
  const [dispH, setDispH] = useState(contH);

  const imgSrc = imageUri
    ? { uri: imageUri }
    : require('../../assets/Paper_size.jpg');

  const [edited, setEdited] = useState({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState('');

  

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
  // scale image
   useEffect(() => {
     if (!natW || !natH) return;

    // Calculate scale based *only* on the container height (contH) 
    // and the image's natural height (natH) to ensure vertical fit.
     const scale = contH / natH; 
     setDispW(Math.round(natW * scale)); // This will maintain the aspect ratio
     setDispH(Math.round(natH * scale)); // This will be equal to contH
   }, [natW, natH, contH]); // Removed contW as it's no longer the primary constraint

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

  const IMG_W = 1300;
  const IMG_H = 620;

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
              {/* ALIGNMENT LAYER — THIS IS REQUIRED */}
              <View
                style={{
                  width: contW,
                  height: contH,
                  alignItems: 'center',        // horizontal centering
                  justifyContent: 'center' // vertical centering
                }}
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

              {/* PARAM BOXES */}
{PARAM_SR.map((sr) => {
  const pos = POSITIONS[sr];
  const val = edited[sr] ?? values[sr]?.value_01 ?? '';

  // Clamp percentages
  const xPct = Math.max(0, Math.min(pos.x, 100));
  const yPct = Math.max(0, Math.min(pos.y, 100));

  // Compute CENTER position
  let cx = (xPct / 100) * IMG_W;
  let cy = (yPct / 100) * IMG_H;

  // Clamp CENTER so box stays fully visible
  cx = Math.max(BOX_W / 2, Math.min(cx, IMG_W - BOX_W / 2));
  cy = Math.max(0, Math.min(cy, IMG_H));


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
      <Text
  style={[
    styles.paramText,
    {
fontSize: fs(PARAM_FONT_SIZES[sr] ?? 28)
    },
    dark && { color: '#fff' },
  ]}
>
  {val}
</Text>
    </TouchableOpacity>
  );
})}


              {/* SERIAL BOXES */}
{SERIAL_POS.map((p) => {
  const xPct = Math.max(0, Math.min(p.x, 100));
  const yPct = Math.max(0, Math.min(p.y, 100));

  let cx = (xPct / 100) * IMG_W;
  let cy = (yPct / 100) * IMG_H;

  cx = Math.max(BOX_W / 2, Math.min(cx, IMG_W - BOX_W / 2));
  cy = Math.max(BOX_H / 2, Math.min(cy, IMG_H - BOX_H / 2));

  return (
    <View
      key={p.id}
      pointerEvents="none"
      style={[
        styles.serialBox,
        {
          left: cx,
          top: cy,
width: clamp(s(50), 36, 56),
height: clamp(s(30), 22, 34),

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
          </View>
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
      
      <VideoModal
            visible={videoPopup}
            onClose={() => setVideoPopup(false)}
          />

      {/* VALUE EDITOR */}
      <Modal visible={editingSr !== null} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View
                style={[
                  styles.modalEdit,
                  { width: clamp(screenW * 0.9, 600, 1100) },
                ]}
              >
              <Text style={styles.modalTitle}>
                Edit Parameter No. :- {editingSr}
              </Text>
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
    const sr = editingSr!;
    const newVal = tempVal;

    // 1️⃣ Update local UI state (unchanged behavior)
    setEdited({ ...edited, [sr]: newVal });

    // 2️⃣ 🔴 REPORT EDIT TO MAINSCREEN (THIS WAS MISSING)
    onParamEdit?.({
      parameter_no: sr,
      value_01: newVal,
      section: values[sr]?.section ?? 'PAPER SIZES',
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
<View
  style={[
    styles.modalTable,
    {
      width: clamp(screenW * 0.95, 600, 1100),
      maxHeight: clamp(screenH * 0.85, 400, 700),
    },
  ]}
>


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


      {/* TABLE CONTAINER */}
      <View style={styles.popupTable}>

        {/* HEADER */}
        <View style={[styles.popupRow, styles.popupHeader]}>
          {POPUP_COLUMNS .map((col, i) => (
            <Text
              key={col.key}
              style={[
                styles.popupCell,
                col.width && { width: col.width },
                col.flex && { flex: col.flex },
                col.align === 'left' && styles.leftAlign,
                i !== POPUP_COLUMNS .length - 1 && styles.popupColBorder,
                styles.popupHeaderText,
              ]}
            >
              {{
                sr: 'SR',
                parameter: 'Parameter',
                orig: 'Original',
                changed: 'Changed',
              }[col.key]}
            </Text>
          ))}
        </View>

        {/* ROWS */}
        {PARAM_SR.map((sr) => {
          const orig = values[sr]?.value_01 ?? '';
          const param = values[sr]?.parameter ?? '';
          const changed = edited[sr] ?? '-';

          return (
            <View key={sr} style={styles.popupRow}>
              {POPUP_COLUMNS .map((col, i) => {
                let value = '';
                if (col.key === 'sr') value = sr;
                if (col.key === 'parameter') value = param;
                if (col.key === 'orig') value = orig;
                if (col.key === 'changed') value = changed;

                return (
                  <Text
                      key={col.key}
                      style={[
                        styles.popupCell,
                        styles.popupBodyText,   // 👈 ADD
                        col.width && { width: col.width },
                        col.flex && { flex: col.flex },
                        col.align === 'left' && styles.leftAlign,
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
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#ffffffff',
    borderRadius: 8,
    overflow: 'visible',
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
    flex: .85,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    backgroundColor: '#ffffffff',
  },

  rightButtons: {
    flex: clamp(0.15, 0.18, 0.25),
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    backgroundColor: '#ffffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#ffffffff',
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
    fontSize: fs(FONT_SIZE.sidebar), 
    fontWeight: '700',
  },

  loading: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },

 paramBox: {
  position: 'absolute',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 6,
  zIndex: 10,
}
,

  paramText: {
    fontSize: 28,
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
fontSize: fs(20),

    fontWeight: '700',
  },

  modalBg: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 20,
  },
modalTable: {
  backgroundColor: '#fff',
  padding: POPUP.TABLE.padding ?? 12,
  borderRadius: POPUP.TABLE.borderRadius ?? 10,
  alignSelf: 'center',
},

modalEdit: {
  backgroundColor: '#fff',
  padding: POPUP.EDIT.padding ?? 12,
  borderRadius: POPUP.EDIT.borderRadius ?? 10,
  alignSelf: 'center',
},


  modalTitle: {
  fontSize: fs(POPUP.TABLE.titleFont),

  fontWeight: '700',
  marginBottom: 10,
},


  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 8,
    fontSize: fs(POPUP.EDIT.inputFont),   // 👈 increase text size here

  },

  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  cancel: {
    marginRight: 20,
    color: '#666',
    fontSize: fs(18),

  },
  save: {
    color: '#007bff',
    fontWeight: '700',
    fontSize: fs(18),
  },

 

  tableWrapper: {
  borderWidth: 1,
  borderColor: '#cececeff',
  borderRadius: 6,
  overflow: 'hidden',
  position: 'relative',
},

tblHead: {
  flexDirection: 'row',
  backgroundColor: '#e8e8f5',
  paddingVertical: 6,
},

tblRow: {
  flexDirection: 'row',
  paddingVertical: 8,
  borderTopWidth: 1,
  borderColor: '#cececeff',
},

cell: {
  paddingVertical: 8,
  textAlign: 'center',
},

leftAlign: {
  textAlign: 'left',
  paddingLeft: 6,
},

colBorder: {
  borderRightWidth: 1,
  borderColor: '#cececeff',
},

headerText: {
  fontWeight: '700',
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
  borderTopWidth: 1,
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
  fontSize: fs(POPUP.TABLE.headerFont),
},

popupBodyText: {
  fontSize: fs(POPUP.TABLE.bodyFont),
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
  fontSize: fs(POPUP.TABLE.closeFont),
  fontWeight: '800',
  color: '#444',
  paddingLeft: 5,
},

btnGray: {
  backgroundColor: '#6c757d',
  paddingVertical: 10,
  paddingHorizontal: 8,
  borderRadius: 6,
  width: '90%',
  marginTop: 10,
},


});

export default React.forwardRef(MachinePanelInner);

