// src/Features/MachinePanel/RPF/PaperSizes.tsx
import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import ZoomableView from "@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView";
import { useTheme } from "../../../theme/ThemeProvider";

type Props = {
  recipeId: number;
  recipeName?: string;
  imageUri?: string;
  initialParams?: any[];
  onClose?: () => void;
};

const SR_LIST = [1, 2, 3, 4, 5, 6];

const POSITIONS_BY_SR: Record<number, { x: number; y: number }> = {
  1: { x: 18, y: 7 },
  2: { x: 10, y: 56 },
  3: { x: 20, y: 20 },
  4: { x: 63, y: 63 },
  5: { x: 90, y: 58 },
  6: { x: 90, y: 90 },
};

const SERIAL_POSITIONS = [
  { id: 1, x: 28, y: 7 },
  { id: 2, x: 10, y: 65 },
  { id: 3, x: 30, y: 20 },
  { id: 4, x: 55, y: 65 },
  { id: 5, x: 88, y: 50 },
  { id: 6, x: 93, y: 81 },
];

function PaperSizes(
  { recipeId, recipeName, imageUri, initialParams = [], onClose }: Props,
  ref: any
) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [editedValues, setEditedValues] = useState<Record<number, string>>({});
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState("");

  const [loading, setLoading] = useState(!initialParams);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);

  const screenW = Dimensions.get("window").width;
  const screenH = Math.round(Dimensions.get("window").height * 0.45);

  const [contW, setContW] = useState(screenW);
  const [contH, setContH] = useState(screenH);

  const [dispW, setDispW] = useState(screenW);
  const [dispH, setDispH] = useState(screenH);

  const originalMap: Record<number, any> = {};
  initialParams.forEach((p) => {
    originalMap[p.parameter_no] = p;
  });

  const imgSrc = imageUri
    ? { uri: imageUri }
    : require("../../../assets/Images/Paper_size.jpg");

  // Load image dimensions
  useEffect(() => {
    const uri = imageUri ?? Image.resolveAssetSource(imgSrc).uri;
    Image.getSize(
      uri,
      (w, h) => {
        setNatW(w);
        setNatH(h);
        setLoading(false);
      },
      () => {
        setNatW(contW);
        setNatH(contH);
        setLoading(false);
      }
    );
  }, []);

  // Scale image
  useEffect(() => {
    if (!natW || !natH) return;
    const scale = Math.min(contW / natW, contH / natH);
    setDispW(natW * scale);
    setDispH(natH * scale);
  }, [natW, natH, contW, contH]);

  // Expose minimal API
  useImperativeHandle(ref, () => ({
    getEditedValues: () => editedValues,
    getOriginalParams: () => initialParams,
    getSrList: () => SR_LIST,
  }));

  const openEditor = (sr: number, currentValue: string) => {
    setEditingSr(sr);
    setTempValue(currentValue);
  };

  const saveEditor = () => {
    if (editingSr == null) return;
    setEditedValues((prev) => ({
      ...prev,
      [editingSr]: tempValue,
    }));
    setEditingSr(null);
    setTempValue("");
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContW(width);
        setContH(height);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, dark ? styles.white : styles.black]}>
          {recipeName ?? `Recipe ${recipeId}`}
        </Text>

        {onClose && (
          <Text style={styles.close} onPress={onClose}>
            Close
          </Text>
        )}
      </View>

      <View style={styles.centerBox}>
        <ZoomableView minScale={1} maxScale={4} doubleTapScale={2}>
          <ImageBackground
            source={imgSrc}
            resizeMode="contain"
            style={{ width: dispW, height: dispH }}
          >
            {loading && (
              <View
                style={[
                  styles.loadingOverlay,
                  { width: dispW, height: dispH },
                ]}
              >
                <ActivityIndicator size="large" />
              </View>
            )}

            {SR_LIST.map((sr) => {
              const pos = POSITIONS_BY_SR[sr];
              const original = originalMap[sr];
              const edited = editedValues[sr];

              const display =
                edited !== undefined
                  ? String(edited)
                  : original
                  ? String(original.value_01)
                  : "";

              const left = (pos.x / 100) * dispW;
              const top = (pos.y / 100) * dispH;

              return (
                <TouchableOpacity
                  key={sr}
                  style={[
                    styles.overlay,
                    {
                      left,
                      top,
                      transform: [
                        { translateX: -15 },
                        { translateY: -12 },
                      ],
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => openEditor(sr, display)}
                >
                  <Text style={[styles.overlayText, dark && { color: "#fff" }]}>
                    {display}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {SERIAL_POSITIONS.map((item) => {
              const left = (item.x / 100) * dispW;
              const top = (item.y / 100) * dispH;

              return (
                <View
                  key={`serial-${item.id}`}
                  pointerEvents="none"
                  style={[
                    styles.serial,
                    {
                      left,
                      top,
                      transform: [
                        { translateX: -15 },
                        { translateY: -12 },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.serialText}>{item.id}</Text>
                </View>
              );
            })}
          </ImageBackground>
        </ZoomableView>
      </View>

      <Modal
        visible={editingSr !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingSr(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Edit Value (SR {editingSr})
            </Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempValue}
              onChangeText={setTempValue}
            />

            <View style={styles.row}>
              <Text
                style={styles.cancel}
                onPress={() => setEditingSr(null)}
              >
                Cancel
              </Text>

              <Text style={styles.save} onPress={saveEditor}>
                Save
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default forwardRef(PaperSizes);

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  title: { fontSize: 16, fontWeight: "700" },
  white: { color: "#fff" },
  black: { color: "#000" },

  close: { color: "#007bff", fontWeight: "700" },

  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 30,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  overlayText: {
    fontWeight: "700",
    fontSize: 10,
  },

  serial: {
    position: "absolute",
    backgroundColor: "#000",
    borderColor: "#fff",
    borderWidth: 1.2,
    borderRadius: 6,
    width: 30,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  serialText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
  },

  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 16,
  },

  row: { flexDirection: "row", justifyContent: "flex-end" },
  cancel: { marginRight: 20, color: "#666" },
  save: { color: "#007bff", fontWeight: "700" },
});
