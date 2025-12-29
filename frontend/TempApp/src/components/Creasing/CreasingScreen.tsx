// src/components/Creasing/CreasingScreen1.tsx
import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect ,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';

import CreasingDropdown from './CreasingDropdown';

/* ---------- CONFIG ---------- */

const CREASING_PARAM_NOS = [297, 298, 299, 300];
const DROPDOWN_COUNT = 4;

/* ---------- COMPONENT ---------- */

function CreasingScreen1(
  { onSave, onParamEdit , initialParams }: any,
  ref: any
) {
 const [values, setValues] = useState<(number | null)[]>(
  Array(DROPDOWN_COUNT).fill(null)
);


  useEffect(() => {
  if (!initialParams) return;

  const next = CREASING_PARAM_NOS.map(sr => {
    const p = initialParams.find(
      (x: any) => Number(x.parameter_no) === sr
    );
    return p ? Number(p.value_01) : null;
  });

  setValues(next);
}, [initialParams]);


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

   setInitialValues: (vals: number[]) => {
  setValues(vals);
},

  }));

  /* ---------- HANDLERS ---------- */

const handleChange = (index: number, value: number | null) => {
    const next = [...values];
    next[index] = value;
    setValues(next);

    onParamEdit?.({
      parameter_no: CREASING_PARAM_NOS[index],
      value_01: value ?? '',
      section: 'Creasing',
      parameter: `Creasing ${index + 1}`,
      unit: '',
    });
  };

  /* ---------- UI ---------- */

  return (
  <View style={styles.container}>
    <View style={styles.bodyRow}>

      {/* LEFT IMAGE AREA */}
      <View style={styles.leftArea}>
        <ImageBackground
          source={require('../../assets/creasingbackground.jpg')}
          style={styles.image}
          resizeMode="contain"
        >
          {/* DROPDOWNS OVER IMAGE */}
         <View style={styles.overlay}>
  {values.map((val, index) => (
    <View key={index} style={styles.dropdownSlot}>
      <CreasingDropdown
        value={val}
        onChange={(v) => handleChange(index, v)}
      />
    </View>
  ))}
</View>
        </ImageBackground>
      </View>

      {/* RIGHT BUTTON STRIP (EXACT LIKE K2A) */}
      <View style={styles.rightButtons}>
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

export default forwardRef(CreasingScreen1);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
 image: {
  width: '100%',
  height: '100%',
},
dropdownSlot: {
  marginHorizontal: 0,   // 👈 adjust THIS number only
},

overlay: {
  position: 'absolute',
  top: 20,
  left: 0,
  right: 0,              // ⬅ allows centering
  flexDirection: 'row',
  justifyContent: 'center',
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
  bodyRow: {
  flex: 1,
  flexDirection: 'row',
},

leftArea: {
  flex: 0.85,
  overflow: 'hidden',
},

rightButtons: {
  flex: 0.15,
  alignItems: 'center',
  paddingVertical: 10,
  backgroundColor: '#fff',
},

creaseSlot: {
  width: 48,        // horizontal pitch (distance between dropdown centers)
  alignItems: 'center',
},


});
