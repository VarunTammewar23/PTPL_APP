// src/components/MachinePanel.tsx
import React, { useEffect, useMemo, useState, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import ZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView';
import { useTheme } from '../../../theme/ThemeProvider';
import { apiGet } from '../../../api/api';

type Props = {
  recipeId: number;
  recipeName?: string;
  imageUri?: string;
  onClose?: () => void;
  initialParams?: any[];
  pollMs?: number;
};

interface RecipeParam {
  parameter_no: number;
  section?: string;
  parameter?: string;
  value_01?: number | string;
  unit?: string;
}

const OVERLAY_WIDTH = 30;
const OVERLAY_HEIGHT = 24;
const OVERLAY_FONT_SIZE = 10;
const OVERLAY_BORDER_RADIUS = 8;

const POSITIONS_BY_SR: Record<number, { x: number; y: number }> = {
  1: { x: 18, y: 7 },
  2: { x: 10, y: 56 },
  3: { x: 20, y: 20 },
  4: { x: 63, y: 63 },
  5: { x: 90, y: 58 },
  6: { x: 90, y: 90 },
};

const SR_LIST = [1, 2, 3, 4, 5, 6];
const SERIAL_POSITIONS = [
  { id: 1, x: 28, y: 7 },
  { id: 2, x: 10,  y: 65 },
  { id: 3, x: 30, y: 20 },
  { id: 4, x: 55, y: 65 },
  { id: 5, x: 88, y: 50 },
  { id: 6, x: 93, y: 81 },
];


function MachinePanelInner(
  {
    recipeId,
    recipeName,
    imageUri,
    onClose,
    initialParams,
    pollMs = 2000,
  }: Props,
  ref: any
) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState<boolean>(!initialParams);
  const [params, setParams] = useState<RecipeParam[]>(initialParams ?? []);

  const [natW, setNatW] = useState<number | null>(null);
  const [natH, setNatH] = useState<number | null>(null);
  const [contW, setContW] = useState<number>(Dimensions.get('window').width);
  const [contH, setContH] = useState<number>(Math.round(Dimensions.get('window').height * 0.45));

  const [dispW, setDispW] = useState<number>(contW);
  const [dispH, setDispH] = useState<number>(contH);

  const imgSrc = imageUri ? { uri: imageUri } : require('../../../assets/Paper_size.jpg');

  // Edited values state (keyed by parameter_no)
  const [editedValues, setEditedValues] = useState<Record<number, string>>({});
  // editing modal state
  const [editingSr, setEditingSr] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const resolveLocal = (src: any) => {
      try {
        const resolved = Image.resolveAssetSource(src);
        if (mounted) {
          setNatW(resolved.width);
          setNatH(resolved.height);
        }
      } catch {
        if (mounted) {
          setNatW(contW);
          setNatH(contH);
        }
      }
    };

    if (imageUri) {
      Image.getSize(
        imageUri,
        (w, h) => {
          if (!mounted) return;
          setNatW(w);
          setNatH(h);
        },
        () => {
          if (mounted) {
            setNatW(contW);
            setNatH(contH);
          }
        }
      );
    } else {
      resolveLocal(imgSrc);
    }

    return () => {
      mounted = false;
    };
  }, [imageUri, contW, contH, imgSrc]);

  useEffect(() => {
    if (!natW || !natH) {
      setDispW(contW);
      setDispH(contH);
      return;
    }
    const scale = Math.min(contW / natW, contH / natH);
    setDispW(Math.round(natW * scale));
    setDispH(Math.round(natH * scale));
  }, [natW, natH, contW, contH]);

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      setContW(window.width);
      setContH(Math.round(window.height * 0.45));
    };

    const sub: any =
      (Dimensions as any).addEventListener && Dimensions.addEventListener('change', onChange);

    return () => {
      try {
        if (sub?.remove) sub.remove();
        else if ((Dimensions as any).removeEventListener)
          (Dimensions as any).removeEventListener('change', onChange);
      } catch {}
    };
  }, []);

  const fetchParams = async () => {
    try {
      const res = await apiGet(`/recipes/${recipeId}`, { timeout: 8000 });
      const p: RecipeParam[] = res.data?.params ?? [];
      setParams(p);
    } catch (err) {
      console.warn('MachinePanel fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    if (!initialParams) {
      setLoading(true);
      fetchParams();

      const id = setInterval(() => {
        if (!alive) return;
        fetchParams();
      }, pollMs);

      return () => {
        alive = false;
        clearInterval(id);
      };
    } else {
      // if initialParams provided, ensure local params are initialized
      setParams(initialParams);
      setLoading(false);
    }
  }, [recipeId, initialParams, pollMs]);

  const valuesBySr = useMemo(() => {
    const map: Record<number, RecipeParam | null> = {};
    SR_LIST.forEach((sr) => {
      map[sr] = params.find((p) => Number(p.parameter_no) === sr) ?? null;
    });
    return map;
  }, [params]);

  // Expose getFinalParams to parent via ref
  useImperativeHandle(ref, () => ({
    getFinalParams: () => {
      return SR_LIST.map((sr) => {
        const original = valuesBySr[sr];
        const edited = editedValues[sr];
        return {
          parameter_no: sr,
          section: original?.section ?? '',
          parameter: original?.parameter ?? '',
          value_01: edited !== undefined ? edited : original?.value_01 ?? '',
          unit: original?.unit ?? '',
        };
      });
    },
  }));

  const openEditor = (sr: number, current: string) => {
    setEditingSr(sr);
    setTempValue(String(current ?? ''));
  };

  const saveEditor = () => {
    if (editingSr === null) return;
    setEditedValues((prev) => ({ ...prev, [editingSr]: tempValue }));
    setEditingSr(null);
    setTempValue('');
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width) setContW(width);
        if (height) setContH(Math.round(height));
      }}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, isDark ? { color: '#fff' } : { color: '#111' }]}>
          {recipeName ?? `Recipe ${recipeId}`}
        </Text>

        {onClose ? (
          <Text style={styles.closeText} onPress={onClose}>
            Close
          </Text>
        ) : null}
      </View>

      <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center',paddingLeft: 20 }}>
        <ZoomableView minScale={1} maxScale={4} doubleTapScale={2} style={{ width: dispW, height: dispH }}>
          <ImageBackground source={imgSrc} style={{ width: dispW, height: dispH }} resizeMode="contain">
            {loading && (
              <View style={[styles.loadingOverlay, { width: dispW, height: dispH }]}>
                <ActivityIndicator size="large" />
              </View>
            )}

            {SR_LIST.map((sr) => {
              const pos = POSITIONS_BY_SR[sr];
              const param = valuesBySr[sr];
              const display = editedValues[sr] !== undefined ? String(editedValues[sr]) : (param ? String(param.value_01 ?? '') : '');

              const leftPx = Math.round((pos.x / 100) * dispW);
              const topPx = Math.round((pos.y / 100) * dispH);

              return (
                <TouchableOpacity
                  key={`ov-${sr}`}
                  activeOpacity={0.8}
                  onPress={() => openEditor(sr, display)}
                  style={[
                    styles.overlay,
                    {
                      left: leftPx,
                      top: topPx,
                      transform: [
                        { translateX: -(OVERLAY_WIDTH / 2) },
                        { translateY: -(OVERLAY_HEIGHT / 2) },
                      ],
                      backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)',
                      width: OVERLAY_WIDTH,
                      height: OVERLAY_HEIGHT,
                      borderRadius: OVERLAY_BORDER_RADIUS,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.overlayValue,
                      isDark ? { color: '#fff' } : { color: '#000' },
                      { fontSize: OVERLAY_FONT_SIZE },
                    ]}
                  >
                    {display}
                  </Text>
                </TouchableOpacity>
              );
            })}
{/* SERIAL_POSITIONS box  */}
            {SERIAL_POSITIONS.map(item => {
            const leftPx = Math.round((item.x / 100) * dispW);
  const topPx = Math.round((item.y / 100) * dispH);

  return (
    <View
      key={`serial-${item.id}`}
      pointerEvents="none" // 🔒 disable any touch
      style={[
        styles.serialOverlay,
        {
          left: leftPx,
          top: topPx,
          width: OVERLAY_WIDTH,
          height: OVERLAY_HEIGHT,
          transform: [
            { translateX: -(OVERLAY_WIDTH / 2) },
            { translateY: -(OVERLAY_HEIGHT / 2) },
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

      {/* Editor modal */}
      <Modal visible={editingSr !== null} animationType="fade" transparent onRequestClose={() => setEditingSr(null)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <Text style={modalStyles.title}>Edit Value (SR {editingSr})</Text>
            <TextInput
              style={modalStyles.input}
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType="numeric"
              placeholder="Enter value"
            />
            <View style={modalStyles.row}>
              <TouchableOpacity onPress={() => { setEditingSr(null); setTempValue(''); }}>
                <Text style={modalStyles.cancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={saveEditor}>
                <Text style={modalStyles.save}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  box: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 420,
    padding: 14,
    borderRadius: 10,
    elevation: 8,
  },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancel: { marginRight: 20, color: '#666' },
  save: { fontWeight: '700', color: '#007bff' },
});

const styles = StyleSheet.create({

serialOverlay: {
  position: 'absolute',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000',  // black box
  borderColor: '#fff',      // white border
  borderWidth: 1.5,
  borderRadius: 6,
  paddingHorizontal: 6,
},

serialText: {
  color: '#fff',            // white text
  fontSize: 10,
  fontWeight: '700',
  textAlign: 'center',
},

  container: {
    flex: 1,
    minHeight: 220,
    maxHeight: 620,
    marginVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    overflow: 'hidden',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
  },

  closeText: {
    color: '#007bff',
    fontWeight: '700',
  },

  loadingOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  overlayValue: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default React.forwardRef(MachinePanelInner);
