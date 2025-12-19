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
import { Platform } from 'react-native';

const ANDROID_VIDEO_URI = __DEV__
  ? 'android.resource://com.tempapp.debug/raw/samplevideo'
  : 'android.resource://com.tempapp/raw/samplevideo';


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




          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
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
    width: width * 0.9,
    backgroundColor: '#ffffffff',
    borderRadius: 10,
    overflow: 'hidden',
    paddingBottom: 1,
  },
  video: {
    width: '95%',
    height: 620,
    backgroundColor: '#ffffffff',
    alignSelf: 'center',
  },
  closeBtn: {
    paddingVertical: 1,
    alignItems: 'center',
  },
  closeText: {
    color: '#000000ff',
    fontSize: 22,
    fontWeight: '700',
  },
});
