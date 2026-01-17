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
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '../../ui/typography';  // Typography constants


/* ---------- CONFIG ---------- */

const CREASING_BOX_PARAM_NOS = [
  288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298
];

const CREASING_PARAM_NOS = [
  275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285
];

const CREASING_YN_PARAM_NOS = [
  262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272
];

const DROPDOWN_COUNT = 11; //number of dropdowns

/* ---------- COMPONENT ---------- */

function CreasingScreen1(
  { onSave, onParamEdit , initialParams }: any,
  ref: any
) {
 const [values, setValues] = useState<(number | null)[]>(
  Array(DROPDOWN_COUNT).fill(null)
);

const [ynValues, setYnValues] = useState<(0 | 1 | null)[]>( //Y/N row
  Array(DROPDOWN_COUNT).fill(null)
);
const [boxValues, setBoxValues] = useState<(string | number)[]>(
  Array(DROPDOWN_COUNT).fill('')
);

const [edited, setEdited] = useState<Record<number, string>>({});
const [editingSr, setEditingSr] = useState<number | null>(null);
const [tempVal, setTempVal] = useState('');



  useEffect(() => {
  if (!initialParams) return;

  const next = CREASING_PARAM_NOS.map(sr => {
    const p = initialParams.find(
      (x: any) => Number(x.parameter_no) === sr
    );
    return p ? Number(p.value_01) : null;
  });
     //Y/N row
    const nextYN = CREASING_YN_PARAM_NOS.map(sr => {
    const p = initialParams.find(
      (x: any) => Number(x.parameter_no) === sr
    );
    return p ? Number(p.value_01) as 0 | 1 : null;
  });

  const nextBoxValues = CREASING_BOX_PARAM_NOS.map(sr => {
  const p = initialParams.find(
    (x: any) => Number(x.parameter_no) === sr
  );
  return p ? p.value_01 ?? '' : '';
});

setBoxValues(nextBoxValues);


  setValues(next);
  setYnValues(nextYN);

}, [initialParams]);


  /* ---------- REF API ---------- */

  useImperativeHandle(ref, () => ({ //chnaged 
  getFinalParams: () => [
    ...values.map((v, i) => ({
      parameter_no: CREASING_PARAM_NOS[i],
      value_01: v ?? '',
      section: 'Creasing',
      parameter: `Creasing ${i + 1}`,
      unit: '',
    })),

    ...ynValues.map((v, i) => ({
      parameter_no: CREASING_YN_PARAM_NOS[i],
      value_01: v ?? 0, // 0 or 1
      section: 'Creasing',
      parameter: `Creasing Enable ${i + 1}`,
      unit: '',
    })),

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

  //Y/N row
const handleYNChange = (index: number, value: 0 | 1 | null) => {
  if (value === null) return;

  const next = [...ynValues];
  next[index] = value;
  setYnValues(next);

  onParamEdit?.({
    parameter_no: CREASING_YN_PARAM_NOS[index],
    value_01: value,
    section: 'Creasing',
    parameter: `Creasing Enable ${index + 1}`,
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
          <View style={styles.columnRow}>
            {values.map((val, index) => {
              const sr = CREASING_BOX_PARAM_NOS[index];
              const displayVal =
                edited[sr] ?? boxValues[index] ?? '-';

              return (
                <View key={index} style={styles.column}>

                  {/* TOP DROPDOWN */}
                  <CreasingDropdown
                    value={val}
                    onChange={(v) => handleChange(index, v)}
                  />

                  {/* GREEN PARAMETER BOX */}
                  <TouchableOpacity
                    style={styles.paramBox}
                    onPress={() => {
                      setEditingSr(sr);
                      setTempVal(String(displayVal));
                    }}
                  >
                    <Text style={styles.paramText}>
                      {displayVal}
                    </Text>
                  </TouchableOpacity>

                  {/* Y / N DROPDOWN */}
                  <View style={styles.ynRow}>
                    <CreasingDropdown
                      value={ynValues[index]}
                      mode="yesno"
                      onChange={(v) => handleYNChange(index, v as 0 | 1)}
                    />
                  </View>

                </View>
              );
            })}
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
    {/* EDIT GREEN BOX MODAL */}
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
                    setEdited({ ...edited, [sr]: tempVal });

                    const orig = initialParams?.find(
                      (p: any) => Number(p.parameter_no) === sr
                    );

                    onParamEdit?.({
                      parameter_no: sr,
                      value_01: tempVal,
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
    fontSize: FONT_SIZE.sidebar, 
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

columnRow: {
  position: 'absolute',
  top: 20,
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'center',
},

column: {
  width: 90,              // 👈 FIXED column width (important)
  alignItems: 'center',
},

paramBox: {
  marginTop: 8,
  width: 75,
  height: 37,
  borderWidth: 1,
  borderColor: '#000',
  backgroundColor: '#1edd3e',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 2,
},

paramText: {
  fontSize: 20,
  fontWeight: '700',
  color: '#000',
},

ynRow: {
  marginTop: 14,
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
    fontSize: 18,

  },
  save: {
    color: '#007bff',
    fontWeight: '700',
    fontSize: 18,
  },


});
