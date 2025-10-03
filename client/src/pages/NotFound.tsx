import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <MaterialIcons name="error-outline" size={80} color="#2d8cf0" />
      <Text style={styles.title}>404: Page Not Found</Text>
      <Text style={styles.message}>You look lost. Let&apos;s get you back!</Text>
      <View style={{ height: 20 }} />
      <Button title="Return Home" onPress={() => router.push('/')} color="#4DBA87" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#F6F9FB" },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2d8cf0', marginTop: 10 },
  message: { fontSize: 16, color: '#888', marginBottom: 10, marginTop: 10 },
});