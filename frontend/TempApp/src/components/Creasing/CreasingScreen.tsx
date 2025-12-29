// src/components/Creasing/CreasingScreen.tsx

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

import CreasingRow from './CreasingRow';

/* ---------- TYPES ---------- */

type Props = {
  recipeId: number;
  recipeName?: string;
  initialParams?: any[];
  onSave?: (opts?: { mode?: 'save' | 'saveAs' }) => void;
  onParamEdit?: (param: {
    parameter_no: number;
    value_01: string;
    section?: string;
    parameter?: string;
    unit?: string;
  }) => void;
};

/* ---------- CONFIG ---------- */

// later you can map these to actual parameter_no
const CREASING_PARAM_NOS = [201, 202, 203, 204];

/* ---------- COMPONENT ---------- */

function CreasingScreenInner(
  { onSave, onParamEdit }: Props,
  ref: any
) {
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  const [values, setValues] = useState<(string | null)[]>([
    null, null, null, null,
  ]);

  /* ---------- REF API ---------- */

  useImperativeHandle(ref, () => ({
    getFinalParams: () =>
      values.map((v, i) => ({
        parameter_no: CREASING_PARAM_NOS[i],
        value_01: v ?? '',
        section: 'Creasing',
        parameter: `Creasing ${i + 1}`,
        unit: '',
      })),

    clearEdits: () => {
      setValues([null, null, null, null]);
    },
  }));

  /* ---------- HANDLERS ---------- */

  const handleChange = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    setValues(next);

    onParamEdit?.({
      parameter_no: CREASING_PARAM_NOS[index],
      value_01: value,
      section: 'Creasing',
      parameter: `Creasing ${index + 1}`,
      unit: '',
    });
  };

  /* ---------- UI ---------- */

  return (
    <View style={styles.container}>
      <View style={[styles.bodyRow, isPortrait && styles.column]}>

        {/* LEFT IMAGE AREA */}
        <View style={styles.leftArea}>
          <ImageBackground
            source={require('../../assets/background.jpeg')}
            style={styles.image}
            resizeMode="contain"
          >
            {/* DROPDOWNS OVER IMAGE */}
            <View style={styles.overlay}>
              <CreasingRow values={values} onChange={handleChange} />
            </View>
          </ImageBackground>
        </View>

        {/* RIGHT BUTTONS */}
        <View style={[styles.rightButtons, isPortrait && styles.portraitButtons]}>
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
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  bodyRow: {
    flex: 1,
    flexDirection: 'row',
  },

  column: {
    flexDirection: 'column',
  },

  leftArea: {
    flex: 0.85,
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  overlay: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
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
});

/* ---------- EXPORT ---------- */

export default forwardRef(CreasingScreenInner);
