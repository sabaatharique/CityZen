import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function ProfileScreen({ navigation, onLogout }) {
  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout();
      return;
    }

    // Fallback: try to navigate back to Login if no handler provided
    try {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 12 },
});
