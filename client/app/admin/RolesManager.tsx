import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Switch, Button, ActivityIndicator, Alert, ScrollView } from "react-native";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase";
import { useClaims } from "@/providers/ClaimsProvider";

type Roles = { admin: boolean; doctor: boolean; patient: boolean; nurse: boolean; support: boolean };

export default function RolesManager() {
  const { loading, claims } = useClaims();
  const isAdmin = !!(claims?.admin || claims?.roles?.admin);

  const [id, setId] = useState("");
  const [roles, setRoles] = useState<Roles>({ admin: false, doctor: false, patient: false, nurse: false, support: false });
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string>("");

  // You need a callable cloud function "setClaims" deployed in your Firebase backend
  const setClaims = useMemo(() => httpsCallable(getFirebaseFunctions(), "setClaims"), []);

  if (loading) return null;
  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>403 — Admins only</Text>
      </View>
    );
  }
  const apply = async () => {
    setBusy(true);
    try {
      const res = await setClaims({ uidOrEmail: id.trim(), roles });
      setLast(JSON.stringify(res.data, null, 2));
      Alert.alert("Success", "Roles updated.\nAsk the user to sign out/in to refresh claims.");
    } catch (e: any) {
      setLast(String(e?.message || e));
      Alert.alert("Error", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Admin Role Manager</Text>
      <Text>Email or UID</Text>
      <TextInput
        value={id}
        onChangeText={setId}
        placeholder="user@example.com or UID"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 }}
      />
      {(["admin", "doctor", "patient", "nurse", "support"] as (keyof Roles)[]).map((k) => (
        <View key={k} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 16 }}>{k}</Text>
          <Switch value={roles[k]} onValueChange={() => setRoles((r) => ({ ...r, [k]: !r[k] }))} />
        </View>
      ))}
      {busy ? <ActivityIndicator /> : <Button title={busy ? "Applying…" : "Apply Roles"} disabled={busy || !id.trim()} onPress={apply} />}
      {!!last && (
        <View style={{ backgroundColor: "#f6f6f6", borderRadius: 8, padding: 10 }}>
          <Text selectable>{last}</Text>
        </View>
      )}
    </ScrollView>
  );
}