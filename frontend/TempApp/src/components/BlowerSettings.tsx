// src/components/BlowerSettings.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useImperativeHandle,
  useRef
} from "react";
import {
  View, Text, StyleSheet, ImageBackground, Dimensions,
  Image, TouchableOpacity, Modal, TextInput, ActivityIndicator
} from "react-native";
import ZoomableView from "@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView";
import { useTheme } from "../theme/ThemeProvider";
import { apiGet } from "../api/api";

// EDIT THIS WHEN MORE PARAMETERS COME
const SR_LIST = [31];

// X,Y positions (percentage of image)
const POSITIONS = {
  31: { x: 20, y: 25 }
};

// Serial number box location
const SERIAL_POS = [{ id: 31, x: 20, y: 32 }];

const BOX_W = 48, BOX_H = 30;

function BlowerSettingsInner(
  { recipeId, recipeName, imageUri, onClose, initialParams, pollMs = 2000 }: any,
  ref: any
) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const zoomRef = useRef<any>(null);
  const [params, setParams] = useState(initialParams ?? []);
  const [loading, setLoading] = useState(!initialParams);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  const [contW, setContW] = useState(Dimensions.get("window").width);
  const [contH, setContH] = useState(Math.round(Dimensions.get("window").height * 0.45));
  const [dispW, setDispW] = useState(contW);
  const [dispH, setDispH] = useState(contH);

  const imgSrc = imageUri ? { uri: imageUri } : require("../assets/blowersettings.jpeg");

  const [edited, setEdited] = useState<any>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState("");

  // Fetch params
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

  // Resolve actual image dimensions
  useEffect(() => {
    try {
      const r = Image.resolveAssetSource(imgSrc);
      setNatW(r.width);
      setNatH(r.height);
    } catch {}
  }, [imgSrc]);

  // Compute scaled dimensions
  useEffect(() => {
    if (!natW || !natH) return;
    const s = Math.min(contW / natW, contH / natH);
    setDispW(natW * s);
    setDispH(natH * s);
  }, [natW, natH, contW, contH]);

  const values = useMemo(() => {
    const m: any = {};
    SR_LIST.forEach(sr => (m[sr] = params.find(p => Number(p.parameter_no) === sr) ?? null));
    return m;
  }, [params]);

  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      SR_LIST.map(sr => ({
        parameter_no: sr,
        section: values[sr]?.section ?? "BLOWER SETTINGS",
        parameter: values[sr]?.parameter ?? "",
        value_01: edited[sr] ?? values[sr]?.value_01 ?? "",
        unit: values[sr]?.unit ?? ""
      })),
    clearEdits: () => setEdited({})
  }));

  const [tablePopup, setTablePopup] = useState(false);

  return (
    <View
      style={styles.container}
      onLayout={e => {
        setContW(e.nativeEvent.layout.width);
        setContH(e.nativeEvent.layout.height);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, dark && { color: "#fff" }]}>
          BLOWER SETTINGS
        </Text>
        <Text style={styles.close} onPress={onClose}>Close</Text>
      </View>

      {/* Center image like AllSpeed */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ZoomableView minScale={1} maxScale={4} doubleTapScale={2} style={{ width: dispW, height: dispH }}>
          <ImageBackground source={imgSrc} resizeMode="contain" style={{ width: dispW, height: dispH }}>
            {loading && (
              <View style={styles.loading}><ActivityIndicator /></View>
            )}

            {/* Editable value box */}
            {SR_LIST.map(sr => {
              const p = POSITIONS[sr];
              const val = edited[sr] ?? values[sr]?.value_01 ?? "";
              const left = (p.x / 100) * dispW;
              const top = (p.y / 100) * dispH;

              return (
                <TouchableOpacity
                  key={sr}
                  style={[styles.box, {
                    left, top, width: BOX_W, height: BOX_H,
                    transform: [{ translateX: -BOX_W / 2 }, { translateY: -BOX_H / 2 }]
                  }]}
                  onPress={() => { setEditingSr(sr); setTempVal(String(val)); }}
                >
                  <Text style={[styles.boxText, dark && { color: "#fff" }]}>{val}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Serial number */}
            {SERIAL_POS.map(s => (
              <View key={s.id} pointerEvents="none" style={[styles.serial, {
                left: (s.x / 100) * dispW,
                top: (s.y / 100) * dispH,
                width: BOX_W, height: BOX_H,
                transform: [{ translateX: -BOX_W / 2 }, { translateY: -BOX_H / 2 }]
              }]}>
                <Text style={styles.serialText}>{s.id}</Text>
              </View>
            ))}
          </ImageBackground>
        </ZoomableView>
      </View>

      {/* Buttons */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity style={styles.btnBlue} onPress={() => setTablePopup(true)}>
          <Text style={styles.btnText}>SHOW TABLE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGreen}>
          <Text style={styles.btnText}>VIDEO</Text>
        </TouchableOpacity>
      </View>

      {/* Edit modal */}
      <Modal visible={editingSr !== null} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Value</Text>
            <TextInput style={styles.input} value={tempVal} onChangeText={setTempVal} keyboardType="numeric" />
            <View style={styles.row}>
              <Text style={styles.cancel} onPress={() => setEditingSr(null)}>Cancel</Text>
              <Text style={styles.save}
                onPress={() => { setEdited({ ...edited, [editingSr!]: tempVal }); setEditingSr(null); }}
              >
                Save
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Table Modal */}
      <Modal visible={tablePopup} transparent animationType="fade" onRequestClose={() => setTablePopup(false)}>
        <View style={styles.tableBg}>
          <View style={styles.tableBox}>
            <Text style={styles.tableTitle}>Parameter Table</Text>

            <View style={styles.tableHead}>
              <Text style={styles.th}>SR</Text>
              <Text style={styles.th}>Parameter</Text>
              <Text style={styles.th}>Original</Text>
              <Text style={styles.th}>Changed</Text>
            </View>

            {SR_LIST.map(sr => {
              const orig = values[sr]?.value_01 ?? "";
              const nm = values[sr]?.parameter ?? "";
              const changed = edited[sr] ?? "";
              return (
                <View key={sr} style={styles.tr}>
                  <Text style={styles.td}>{sr}</Text>
                  <Text style={styles.td}>{nm}</Text>
                  <Text style={styles.td}>{orig}</Text>
                  <Text style={[styles.td, { color: changed ? "blue" : "#111" }]}>{changed || "-"}</Text>
                </View>
              );
            })}

            <Text style={styles.closeTbl} onPress={() => setTablePopup(false)}>Close</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default React.forwardRef(BlowerSettingsInner);

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 6 },
  header: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 16, fontWeight: "700" },
  close: { color: "#007bff", fontWeight: "700" },
  loading: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },

  box: { position: "absolute", backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", borderRadius: 6 },
  boxText: { fontSize: 12, fontWeight: "700" },

  serial: { position: "absolute", backgroundColor: "#000", justifyContent: "center", alignItems: "center", borderRadius: 6 },
  serialText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  bottomBtns: { position: "absolute", bottom: 12, right: 12, flexDirection: "row" },
  btnBlue: { backgroundColor: "#007bff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginLeft: 6 },
  btnGreen: { backgroundColor: "#28a745", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginLeft: 6 },
  btnText: { color: "#fff", fontWeight: "700" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 18 },
  modal: { backgroundColor: "#fff", borderRadius: 10, padding: 12 },
  modalTitle: { fontWeight: "700", fontSize: 16 },
  input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 6, padding: 8 },
  row: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  cancel: { marginRight: 20, color: "#666" },
  save: { color: "#007bff", fontWeight: "700" },

  tableBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  tableBox: { width: "92%", maxWidth: 720, backgroundColor: "#fff", borderRadius: 10, padding: 12 },
  tableTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  tableHead: { flexDirection: "row", backgroundColor: "#e8e8f5", padding: 6 },
  th: { flex: 1, textAlign: "center", fontWeight: "700" },
  tr: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 6, borderColor: "#eee" },
  td: { flex: 1, textAlign: "center" },
  closeTbl: { color: "#007bff", fontWeight: "700", textAlign: "center", marginTop: 12 }
});
