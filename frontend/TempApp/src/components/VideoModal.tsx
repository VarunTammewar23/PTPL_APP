// PTPL_APP\frontend\TempApp\src\components\VideoModal.tsx

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import Video from 'react-native-video';
import { s, clamp } from '../ui/scale';
import { POPUP } from '../ui/Popup';



type Props = {
  visible: boolean;
  onClose: () => void;
  layout: {
    width: number;
    height: number;
    borderRadius: number;
  };
};

export default function VideoModal({ visible, onClose, layout }: Props) {
  if (!layout) {
    return null;
  }

  const [paused, setPaused] = useState(true);

  // Pause / play based on modal visibility
  useEffect(() => {
    setPaused(!visible);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              width: layout.width,
              borderRadius: layout.borderRadius,
            },
          ]}
        >


          {/* HEADER ROW – SAME AS TABLE POPUP */}
          <View style={styles.popupHeaderRow}>
            <View />
            <TouchableOpacity onPress={onClose} style={styles.popupCloseBtn}>
              <Text style={styles.popupCloseIcon}>✕</Text>
              <Text style={styles.popupCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          <Video
            source={require('../assets/samplevideo.mp4')}
            style={[styles.video, { height: layout.height }]}
            controls
            resizeMode="contain"
            paused={paused}
            useTextureView={true}
            useSecureView={false}
            onError={(e) => console.log('VIDEO ERROR', e)}
            onLoad={(e) => console.log('VIDEO LOADED', e.duration)}
          />

        </View>
      </View>
    </Modal>
  );
}



const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

container: {
  backgroundColor: '#ffffffff',
  overflow: 'hidden',
  paddingVertical: s(10),
},

video: {
  width: '90%',
  backgroundColor: '#ffffffff',
  alignSelf: 'center',
},


  /* ===== TABLE-STYLE CLOSE BUTTON ===== */

  popupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 6,
  },

  popupCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 0,
    marginRight: 13, 
  },

  popupCloseIcon: {
    fontSize: 18, 
    fontWeight: '800',
    color: '#444',
    marginRight: 4,
  },

popupCloseText: {
  fontSize: POPUP.TABLE.closeFont,
  fontWeight: '800',
  color: '#444',
},
});
