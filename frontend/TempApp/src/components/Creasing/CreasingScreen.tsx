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
  Modal,
  TextInput,
} from 'react-native';

import CreasingDropdown from './CreasingDropdown';

/* ---------- CONFIG ---------- */

const CREASING_PARAM_NOS = [297, 298, 299, 300];
const DROPDOWN_COUNT = 4;

const CREASING_BOX_PARAM_NOS = [293, 294, 295, 296];


/* ---------- COMPONENT ---------- */

function CreasingScreen1(
  { onSave, onParamEdit , initialParams }: any,
  ref: any
) {
 const [values, setValues] = useState<(number | null)[]>(
  Array(DROPDOWN_COUNT).fill(null)
);
const [boxValues, setBoxValues] = useState<(string | number)[]>(
  Array(DROPDOWN_COUNT).fill('')
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

useEffect(() => {
  if (!initialParams) return;

  const nextBoxValues = CREASING_BOX_PARAM_NOS.map(sr => {
    const p = initialParams.find(
      (x: any) => Number(x.parameter_no) === sr
    );
    return p ? p.value_01 ?? '' : '';
  });

  setBoxValues(nextBoxValues);
}, [initialParams]);

const [edited, setEdited] = useState<Record<number, string>>({});
const [editingSr, setEditingSr] = useState<number | null>(null);
const [tempVal, setTempVal] = useState('');


  /* ---------- REF API ---------- */

useImperativeHandle(ref, () => ({
  getFinalParams: () => [
    // DROPDOWN PARAMS (297–300)
    ...CREASING_PARAM_NOS.map((sr, i) => ({
      parameter_no: sr,
      value_01: values[i] ?? '',
      section: 'Creasing',
      parameter: `Creasing ${i + 1}`,
      unit: '',
    })),

    // BOX PARAMS (293–296)
    ...CREASING_BOX_PARAM_NOS.map((sr, i) => {
  const orig = initialParams?.find(
    (p: any) => Number(p.parameter_no) === sr
  );

  return {
    parameter_no: sr,
    value_01: edited[sr] ?? boxValues[i] ?? '',
    section: orig?.section ?? 'Creasing',
    parameter: orig?.parameter ?? '',
    unit: orig?.unit ?? '',
  };
}),
  ],
}));


  /* ---------- HANDLERS ---------- */

const handleChange = (index: number, value: number | null) => {
  const next = [...values];
  next[index] = value;
  setValues(next);

  const sr = CREASING_PARAM_NOS[index];

  const orig = initialParams?.find(
    (p: any) => Number(p.parameter_no) === sr
  );

  onParamEdit?.({
    parameter_no: sr,
    value_01: value ?? '',
    section: orig?.section ?? 'Creasing',
    parameter: orig?.parameter ?? '',
    unit: orig?.unit ?? '',
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
      {/* DROPDOWN + IMAGE */}
      <CreasingDropdown
        value={val}
        onChange={(v) => handleChange(index, v)}
      />

      {/* PARAMETER BOX */}
      <TouchableOpacity
        style={styles.paramBox}
        onPress={() => {
        const sr = CREASING_BOX_PARAM_NOS[index];
        const currentVal =
          edited[sr] ??
          boxValues[index] ??
          '';

        setEditingSr(sr);
        setTempVal(String(currentVal));
      }}
      >
        <Text style={styles.paramText}>
  {edited[CREASING_BOX_PARAM_NOS[index]] ??
    boxValues[index] ??
    '-'}
</Text>


      </TouchableOpacity>
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

    {/* EDIT MODAL */}
<Modal visible={editingSr !== null} transparent animationType="fade">
  <View style={styles.modalBg}>
    <View style={styles.modal}>
      <Text style={styles.modalTitle}>Edit Value</Text>

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

            setEdited({ ...edited, [sr]: newVal });

            const orig = initialParams?.find(
  (p: any) => Number(p.parameter_no) === sr
);

onParamEdit?.({
  parameter_no: sr,
  value_01: newVal,
  section: orig?.section ?? 'Creasing',
  parameter: orig?.parameter ?? '',
  unit: orig?.unit ?? '',
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
  marginHorizontal: 0,
  alignItems: 'center',   // ✅ THIS CENTERS EVERYTHING
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

paramBox: {
  marginTop: 6,              // ⬅ space below image
  width: 75,
  height: 37,
  borderWidth: 1,
  borderColor: '#000',
  backgroundColor: '#1edd3eff',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 2,
},

paramText: {
  fontSize: 20,
  fontWeight: '700',
  color: '#000',
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
  width: 400,
  alignSelf: 'center',
},

modalTitle: {
  fontSize: 18,
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

cancel: {
  marginRight: 20,
  color: '#666',
},

save: {
  color: '#007bff',
  fontWeight: '700',
},


});
