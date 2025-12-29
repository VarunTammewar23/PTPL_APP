import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
} from 'react-native';

/* ---------- OPTION CONFIG ---------- */

const OPTIONS = [
  {
    label: 'F3',
    value: 1,
    image: require('../../assets/crease_1.png'),
  },
  {
    label: 'F1',
    value: 2,
    image: require('../../assets/crease_2.png'),
  },
  {
    label: 'F2',
    value: 3,
    image: require('../../assets/crease_3.png'),
  },
  {
    label: '4',
    value: 4,
    image: require('../../assets/crease_4.png'),
  },
  {
    label: 'M32',
    value: 5,
    image: require('../../assets/crease_5.png'),
  },
  {
    label: 'M10',
    value: 6,
    image: require('../../assets/crease_6.png'),
  },
  {
    label: 'M20',
    value: 7,
    image: require('../../assets/crease_7.png'),
  },
  {
    label: 'M12',
    value: 8,
    image: require('../../assets/crease_8.png'),
  },
];

/* ---------- TYPES ---------- */

type Props = {
  value: number | null;
  onChange: (val: number | null) => void;
};

/* ---------- COMPONENT ---------- */

const CreasingDropdown = ({ value, onChange }: Props) => {
  const selected = OPTIONS.find(o => o.value === value);

  const buttonRef = React.useRef<View>(null);
  const [open, setOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState<{ x: number; y: number } | null>(
    null
  );

  return (
    <View style={styles.container}>

  {/* SELECTED LABEL */}
  {selected && (
    <Text style={styles.selectedLabel}>
      {selected.label}
    </Text>
  )}

  {/* DROPDOWN BUTTON */}
  <TouchableOpacity
    ref={buttonRef}
    style={styles.dropdown}
    activeOpacity={0.7}
    onPress={() => {
      buttonRef.current?.measureInWindow((x, y, width, height) => {
        setMenuPos({ x, y: y + height });
        setOpen(true);
      });
    }}
  >
    <Text style={styles.arrow}>▼</Text>
  </TouchableOpacity>


      {/* DROPDOWN MENU */}
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBg}>
          {/* BACKGROUND TAP TO CLOSE */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />

          {/* MENU */}
          {menuPos && (
            <View
              style={[
                styles.menu,
                {
                  position: 'absolute',
                  top: menuPos.y,
                  left: menuPos.x,
                },
              ]}
            >
              {OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.menuItem}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.menuText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Modal>

      {/* IMAGE */}
      {selected && (
        <Image
          source={selected.image}
          style={styles.image}
        />
      )}
    </View>
  );
};

export default CreasingDropdown;

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  dropdown: {
    width: 50,
    height: 45,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    fontSize: 28,
    color: '#000',
  },

  image: {
    width: 100,
    height: 85,
    marginTop: 2,
    resizeMode: 'contain',
  },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  menu: {
    backgroundColor: '#fff',
    borderRadius: 4,
    minWidth: 120,
    elevation: 8,
  },

  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  menuText: {
    fontSize: 14,
    color: '#000',
  },

  selectedLabel: {
  fontSize: 18,
  fontWeight: '600',
  color: '#000',
  marginBottom: 15,   // 👈 space between label & dropdown
},

});
