// PTPL_APP\frontend\TempApp\src\components\VideoModal.tsx

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
import { s, clamp } from '../ui/scale';


type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function VideoModal({ visible, onClose }: Props) {
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
        <View style={styles.container}>

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
            style={styles.video}
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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
width: clamp(width * 0.9, 600, 1100),
    backgroundColor: '#ffffffff',
    borderRadius: 10,
    overflow: 'hidden',
    paddingBottom: 10,
    paddingTop: 6,
  },

  video: {
    width: '95%',
    height: clamp(s(560), 280, 560),
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
    paddingVertical: 4,
    marginRight: 13, 
  },

  popupCloseIcon: {
    fontSize: 18, 
    fontWeight: '800',
    color: '#444',
    marginRight: 4,
  },

  popupCloseText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#444',
  },
});
