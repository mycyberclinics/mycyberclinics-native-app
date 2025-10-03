import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import Notifications from "../components/Notifications";
import { setDefaultField, RootState } from "../store";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Homepage() {
  const router = useRouter();
  const text = useSelector((state: RootState) => state.demo.defaultField);
  const dispatch = useDispatch();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="medical-services" size={36} color="#4DBA87" />
        <Text style={styles.title}>MyCyberClinics</Text>
        <Notifications />
      </View>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Welcome!</Text>
        <Text style={styles.info}>{text}</Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Go to Dashboard"
            color="#4DBA87"
            onPress={() => router.push("/dashboard")}
          />
          <View style={{ height: 10 }} />
          <Button
            title="Change Text"
            color="#2d8cf0"
            onPress={() => dispatch(setDefaultField("Redux Updated!"))}
          />
          <View style={{ height: 10 }} />
          <Button
            title="Go to Settings"
            color="#333"
            onPress={() => router.push("/settings")}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F9FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
  },
  title: { fontSize: 28, fontWeight: "800", color: "#4DBA87", flex: 1, marginLeft: 18 },
  card: {
    margin: 24,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  subtitle: { fontSize: 22, fontWeight: "700", marginBottom: 10, color: "#2d8cf0" },
  info: { fontSize: 16, color: "#333", marginBottom: 24 },
  buttonContainer: { width: "100%" },
});