import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="dashboard" size={34} color="#2d8cf0" />
        <Text style={styles.title}>Dashboard</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.info}>Here you can monitor your clinic’s activities, appointments, and more.</Text>
        <Button title="Go Home" color="#4DBA87" onPress={() => router.push('/')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F9FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
  },
  title: { fontSize: 26, fontWeight: "700", color: "#2d8cf0", marginLeft: 12 },
  card: {
    margin: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    elevation: 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  info: { fontSize: 16, color: "#333", marginBottom: 20 },
});