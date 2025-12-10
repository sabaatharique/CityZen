import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const DUMMY = [
  { id: '1', title: 'Pothole on Main St' },
  { id: '2', title: 'Streetlight not working' },
];

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complaints Feed</Text>
      <FlatList
        data={DUMMY}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={styles.item}>{item.title}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, marginBottom: 8 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
});
