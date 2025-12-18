import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import BottomBar from '../components/BottomBar';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/company_logo.jpeg')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.text}>Welcome</Text>

      <BottomBar
        labels={[
          "HOME",
          "RECIPE",
          "RPF",
          "RT ANGLE",
          "KNIFE 1",
          "KNIFE 2",
          "KNIFE 3",
          "STP TRAY",
          "CREASING"
        ]}
        activePanel="HOME"
        onPressItem={(label) => {
          if (label === "RECIPE") {
            navigation.navigate("Main");
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 260,
    height: 160,
    marginBottom: 20
  },
  text: {
    fontSize: 18,
    fontWeight: '700'
  }
});
