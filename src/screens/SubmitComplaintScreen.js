import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function SubmitComplaintScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Complaint</Text>
      <TextInput placeholder="Title" style={styles.input} />
      <TextInput placeholder="Description" style={[styles.input, { height: 100 }]} multiline />
      <Button title="Submit" onPress={() => navigation.navigate('Feed')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, marginBottom: 12, textAlign: 'center' },
  input: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 },
});
