// src/components/FoldingTray.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useImperativeHandle
} from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ImageBackground,
  Dimensions, Image, TouchableOpacity, Modal, TextInput
} from 'react-native';
import ZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { useTheme } from '../theme/ThemeProvider';
import { apiGet } from '../api/api';

// 👇 CHANGE THESE VALUES AS PER YOUR PARAMETERS
const PARAM_SR = [301, 302, 303, 304]; // sample SR numbers

// x,y are PERCENT POSITIONS on image
const POSITIONS = {
  301: { x: 70, y: 20 },
  302: { x: 70, y: 45 },
  303: { x: 70, y: 65 },
  304: { x: 70, y: 85 },
};

// For left column serial display
const SERIAL_POS = [
  { id: 301, x: 10, y: 20 },
  { id: 302, x: 10, y: 45 },
  { id: 303, x: 10, y: 65 },
  { id: 304, x: 10, y: 85 },
];

const BOX_W = 30, BOX_H = 24;

function FoldingTrayInner(
  { recipeId, recipeName, imageUri, onClose, initialParams, pollMs = 2000 }: any,
  ref: any
) {
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

  const imgSrc = imageUri
    ? { uri: imageUri }
    : require('../assets/foldingtray.jpeg'); // 🔁 replace if needed

  const [edited, setEdited] = useState<any>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState('');

  // FETCH PARAMS FROM SERVER IF initialParams NOT GIVEN
  useEffect(() => {
    if (initialParams) return;

    const load = async () => {
      const res = await apiGet(`/recipes/${recipeId}`);
      setParams(res.data?.params ?? []);
      setLoading(false);
    };

    load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [recipeId, pollMs]);

  // RESOLVE IMAGE DIMENSIONS
  useEffect(() => {
    try {
      const resolved = Image.resolveAssetSource(imgSrc);
      setNatW(resolved.width);
      setNatH(resolved.height);
    } catch {}
  }, [imgSrc]);

  // SCALE IMAGE TO FIT SCREEN
  useEffect(() => {
    if (!natW || !natH) return;
    const scale = Math.min(contW / natW, contH / natH);
    setDispW(natW * scale);
    setDispH(natH * scale);
  }, [natW, natH, contW, contH]);

  // PARAM MAP
  const values = useMemo(() => {
    const map: any = {};
    PARAM_SR.forEach(sr => {
      map[sr] = params.find(p => Number(p.parameter_no) === sr) ?? null;
    });
    return map;
  }, [params]);

  // EXPOSE FINAL PARAMS + CLEAR EDITS TO MAINSCREEN
  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      PARAM_SR.map(sr => ({
        parameter_no: sr,
        section: values[sr]?.section ?? 'FOLDING TRAY',
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
        width && setContW(width);
        height && setContH(height);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, dark && { color: '#fff' }]}>
          {recipeName ?? 'Folding Tray'}
        </Text>
        <Text style={styles.close} onPress={onClose}>Close</Text>
      </View>

      {/* CENTER WRAPPER */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ZoomableView minScale={1} maxScale={4} doubleTapScale={2} style={{ width: dispW, height: dispH }}>
          <ImageBackground source={imgSrc} style={{ width: dispW, height: dispH }} resizeMode="contain">

            {loading && (
              <View style={[styles.loading, { width: dispW, height: dispH }]}>
                <ActivityIndicator />
              </View>
            )}

            {/* PARAMETER BOXES */}
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
                      left, top, width: BOX_W, height: BOX_H,
                      transform: [{ translateX: -BOX_W / 2 }, { translateY: -BOX_H / 2 }],
                    }
                  ]}
                >
                  <Text style={[styles.paramText, dark && { color: '#fff' }]}>{val}</Text>
                </TouchableOpacity>
              );
            })}

            {/* SERIAL LABEL BOXES */}
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
                      left, top, width: BOX_W, height: BOX_H,
                      transform: [{ translateX: -BOX_W / 2 }, { translateY: -BOX_H / 2 }],
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

      {/* SHOW TABLE */}
      <TouchableOpacity style={styles.tableBtn} onPress={() => setTablePopup(true)}>
        <Text style={styles.tableBtnTxt}>SHOW TABLE</Text>
      </TouchableOpacity>

      {/* TABLE POPUP */}
      <Modal visible={tablePopup} transparent animationType="fade">
        <View style={styles.popupBg}>
          <View style={styles.popup}>
            <Text style={styles.tableTitle}>Parameter Table</Text>

            <View style={styles.tblHead}>
              <Text style={styles.th}>SR</Text>
              <Text style={styles.th}>Parameter</Text>
              <Text style={styles.th}>Original</Text>
              <Text style={styles.th}>Changed</Text>
            </View>

            {PARAM_SR.map(sr => {
              const orig = values[sr]?.value_01 ?? '';
              const param = values[sr]?.parameter ?? '';
              const changed = edited[sr] ?? '-';
              return (
                <View key={sr} style={styles.tblRow}>
                  <Text style={styles.td}>{sr}</Text>
                  <Text style={styles.td}>{param}</Text>
                  <Text style={styles.td}>{orig}</Text>
                  <Text style={[styles.td, { color: changed !== '-' ? 'blue' : '#111' }]}>{changed}</Text>
                </View>
              );
            })}

            <TouchableOpacity onPress={() => setTablePopup(false)}>
              <Text style={styles.closeTable}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container:{ flex:1,padding:6,backgroundColor:'#f9fafb',borderRadius:8 },
  header:{ flexDirection:'row',justifyContent:'space-between',marginBottom:6 },
  title:{ fontSize:16,fontWeight:'700' },
  close:{ fontWeight:'700',color:'#007bff' },

  loading:{ position:'absolute',justifyContent:'center',alignItems:'center' },

  paramBox:{ position:'absolute',backgroundColor:'rgba(255,255,255,0.2)',justifyContent:'center',alignItems:'center',borderRadius:6 },
  paramText:{ fontSize:10,fontWeight:'700' },

  serialBox:{ position:'absolute',backgroundColor:'#000',borderRadius:6,borderWidth:1.3,borderColor:'#fff',justifyContent:'center',alignItems:'center' },
  serialText:{ color:'#fff',fontSize:10,fontWeight:'700' },

  modalBg:{ flex:1,justifyContent:'center',backgroundColor:'rgba(0,0,0,0.45)',padding:18 },
  modal:{ backgroundColor:'#fff',padding:12,borderRadius:10 },
  modalTitle:{ fontWeight:'700',fontSize:16,marginBottom:10 },
  input:{ borderWidth:1,borderColor:'#aaa',borderRadius:6,padding:8 },

  row:{ flexDirection:'row',justifyContent:'flex-end',marginTop:12 },
  cancel:{ marginRight:20,color:'#666' },
  save:{ color:'#007bff',fontWeight:'700' },

  tableBtn:{ position:'absolute',right:12,bottom:12,backgroundColor:'#007bff',paddingHorizontal:12,paddingVertical:8,borderRadius:6 },
  tableBtnTxt:{ color:'#fff',fontWeight:'700' },

  popupBg:{ flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.45)' },
  popup:{ width:'92%',maxWidth:720,backgroundColor:'#fff',borderRadius:10,padding:12 },

  tableTitle:{ fontWeight:'700',fontSize:16,marginBottom:8 },

  tblHead:{ flexDirection:'row',backgroundColor:'#e8e8f5',padding:6 },
  th:{ flex:1,textAlign:'center',fontWeight:'700' },

  tblRow:{ flexDirection:'row',paddingVertical:8,borderBottomWidth:1,borderColor:'#eee' },
  td:{ flex:1,textAlign:'center' },

  closeTable:{ marginTop:12,textAlign:'center',color:'#007bff',fontWeight:'700' }
});

export default React.forwardRef(FoldingTrayInner);
