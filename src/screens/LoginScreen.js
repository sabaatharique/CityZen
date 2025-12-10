import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation, route, onLogin }) {
  const handlePress = () => {
    if (typeof onLogin === 'function') {
      onLogin('citizen');
      return;
    }

    // Fallback: attempt a reset if no handler provided
    try {
      navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] });
    } catch (e) {
      // If reset fails (no HomeTab in this navigator), just navigate to root
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />
      <Button title="Login" onPress={handlePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  input: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 },
});
