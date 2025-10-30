import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api/client";
import ButtonComponent from "@/components/ButtonComponent";
import { getFirebaseAuth } from "@/lib/firebase";
import { useTrackOnboardingStep } from "@/lib/hooks/useTrackOnboardingStep";
import Toast from "react-native-toast-message";

/**
 * DoctorCredentialScreen
 *
 * Fix: handle the newer expo-document-picker shape that returns { assets: [...] }
 * and older shapes (uri/name/size directly on result). Normalizes all cases and
 * clears mdcnError when a valid file is selected.
 *
 * Also keeps web hidden-input flow and native upload via fetch.
 */

type UploadedFile = {
  name: string;
  size: number;
  uri: string | undefined;
  type?: string | undefined;
  file?: File | null; // Web File when on web
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.ms-excel",
  "image/jpeg",
  "image/png",
];

export default function DoctorCredentialScreen() {
  const router = useRouter();
  useTrackOnboardingStep();
  const { completeSignUp, syncProfile, setOnboardingComplete } = useAuthStore();

  const colorScheme = useColorScheme();

  const [bio, setBio] = useState("");
  const [mdcnFile, setMdcnFile] = useState<UploadedFile | null>(null);
  const [additionalFile, setAdditionalFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [bioError, setBioError] = useState<string | null>(null);
  const [mdcnError, setMdcnError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Web hidden inputs
  const mdcnInputRef = useRef<HTMLInputElement | null>(null);
  const additionalInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (type: "success" | "error" | "info", text1: string, text2?: string) => {
    Toast.show({ type, text1, text2, visibilityTime: 2500 });
  };

  const validateBio = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 10) return "Please provide a short professional bio (at least 10 characters).";
    return null;
  };

  const validateFile = (file: UploadedFile | null) => {
    if (!file) return "Your current MDCN Annual Practice License is required.";
    if (file.size && file.size > MAX_FILE_SIZE) return "File must be 5MB or less.";
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) return "Unsupported file type. Please upload PDF, PPT, XLS, JPG, or PNG.";
    return null;
  };

  // Helper to get platform-appropriate API base for native
  const getNativeApiBase = () => {
    const env = (process.env as any)?.EXPO_PUBLIC_API_BASE_URL;
    if (env) return env;
    if (Platform.OS === "android") return "http://10.0.2.2:4000"; // Android emulator
    return "http://localhost:4000"; // iOS simulator or local dev
  };

  /**
   * pickFile
   * - Web: triggers hidden input
   * - Native: uses DocumentPicker.getDocumentAsync and normalizes result shapes:
   *   - Newer SDKs may return { assets: [{ uri, name, size, mimeType }] , canceled: false }
   *   - Older shapes may return { uri, name, size, mimeType } or other variations.
   */
  const pickFile = async (setFile: (f: UploadedFile | null) => void, required?: boolean) => {
    if (Platform.OS === "web") {
      if (setFile === setMdcnFile) mdcnInputRef.current?.click();
      else additionalInputRef.current?.click();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_MIME_TYPES,
        copyToCacheDirectory: true,
      });

      // Log the raw result to help debug shapes on the device
      console.log("[DoctorCredential] DocumentPicker raw result:", result);

      // Normalize: check assets[] shape first (expo-media-library / newer picker results)
      const anyRes: any = result;
      let uri: string | undefined = undefined;
      let name: string | undefined = undefined;
      let size: number | undefined = undefined;
      let mime: string | undefined = undefined;

      if (Array.isArray(anyRes.assets) && anyRes.assets.length > 0) {
        const asset = anyRes.assets[0];
        uri = asset.uri || asset.fileUri || asset.uriSource;
        name = asset.name || asset.fileName;
        size = asset.size ?? asset.fileSize ?? 0;
        mime = asset.mimeType || asset.type;
      } else {
        // Fallback to older shape
        uri = anyRes.uri || anyRes.fileCopyUri || anyRes.fileUri;
        name = anyRes.name || anyRes.fileName;
        size = anyRes.size ?? anyRes.fileSize ?? 0;
        mime = anyRes.mimeType || anyRes.type;
      }

      // If still no URI treat as cancel
      if (!uri) {
        if (required) {
          setFile(null);
          setMdcnError("Your current MDCN Annual Practice License is required.");
        }
        return;
      }

      const candidate: UploadedFile = {
        name: name ?? "file",
        size: size ?? 0,
        uri,
        type: mime,
      };

      console.log("[DoctorCredential] normalized candidate:", candidate); 

      const fileErr = validateFile(candidate);
      if (fileErr) {
        showToast("error", "Invalid file", fileErr);
        if (required) setMdcnError(fileErr);
        return;
      }

      // Clear any previous error and set file
      setMdcnError(null);
      setGeneralError(null);
      setFile(candidate);
    } catch (err) {
      console.error("[DoctorCredential] File pick error (native):", err);
      showToast("error", "File selection failed", "Please try again.");
    }
  };

  // Web input change handler
  const handleWebFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: UploadedFile | null) => void, required?: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      if (required) {
        setFile(null);
        setMdcnError("Your current MDCN Annual Practice License is required.");
      }
      return;
    }
    const f = files[0];
    const candidate: UploadedFile = {
      name: f.name,
      size: f.size,
      uri: URL.createObjectURL(f),
      type: f.type,
      file: f,
    };

    const fileErr = validateFile(candidate);
    if (fileErr) {
      showToast("error", "Invalid file", fileErr);
      if (required) setMdcnError(fileErr);
      return;
    }
    setMdcnError(null);
    setGeneralError(null);
    setFile(candidate);
  };

  // Dev: enumerate FormData keys
  const logFormDataKeys = (fd: FormData) => {
    try {
      const keys: string[] = [];
      for (const pair of (fd as any).entries()) keys.push(String(pair[0]));
      console.log("[DoctorCredential] FormData keys:", keys);
    } catch (e) {
      console.warn("[DoctorCredential] Could not enumerate FormData entries for logging", e);
    }
  };

  // uploadDocs: web uses axios, native uses fetch
  const uploadDocs = async () => {
    const formData = new FormData();

    if (bio && typeof bio === "string") formData.append("bio", bio);

    if (Platform.OS === "web") {
      if (!mdcnFile?.file) throw new Error("No file selected for mcdnLicense (web).");
      formData.append("mcdnLicense", mdcnFile.file as File, mdcnFile.name);
      if (additionalFile?.file) formData.append("additionalQualification", additionalFile.file as File, additionalFile.name);
    } else {
      if (!mdcnFile || !mdcnFile.uri) throw new Error("No file selected or URI missing for mcdnLicense (native).");
      formData.append("mcdnLicense", {
        uri: mdcnFile.uri,
        name: mdcnFile.name,
        type: mdcnFile.type || "application/pdf",
      } as any);
      if (additionalFile && additionalFile.uri) {
        formData.append("additionalQualification", {
          uri: additionalFile.uri,
          name: additionalFile.name,
          type: additionalFile.type || "application/pdf",
        } as any);
      }
    }

    logFormDataKeys(formData);
    console.log("[DoctorCredential] mdcnFile uri (native):", mdcnFile?.uri);

    const auth = getFirebaseAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("No auth token found — user not logged in.");

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    if (Platform.OS === "web") {
      const axiosOptions: any = { headers };
      axiosOptions.transformRequest = [
        (data: any, headersObj: any) => {
          try {
            if (headersObj) {
              delete headersObj["Content-Type"];
              delete headersObj["content-type"];
            }
          } catch {}
          return data;
        },
      ];
      const resp = await api.post("/api/profile/upload-doc", formData as any, axiosOptions);
      console.log("[DoctorCredential] upload response (web):", resp.status, resp.data);
      return resp.data;
    } else {
      const base = getNativeApiBase();
      const url = `${base.replace(/\/$/, "")}/api/profile/upload-doc`;
      console.log("[DoctorCredential] Native upload URL:", url);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` } as any, // do not set content-type
          body: formData as any,
        });

        const text = await response.text().catch(() => "");
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        if (!response.ok) {
          console.error("[DoctorCredential] Native upload failed:", response.status, data);
          const err: any = new Error("Upload failed");
          err.response = { status: response.status, data };
          throw err;
        }

        console.log("[DoctorCredential] upload response (native):", response.status, data);
        return data;
      } catch (err) {
        console.error("[DoctorCredential] native fetch upload error:", err);
        throw err;
      }
    }
  };

  const handleContinue = async () => {
    setGeneralError(null);
    const bioErr = validateBio(bio);
    const fileErr = validateFile(mdcnFile);

    setBioError(bioErr);
    setMdcnError(fileErr);

    if (bioErr || fileErr) {
      showToast("error", "Please fix the issues", "Check your bio and required document.");
      return;
    }

    try {
      setLoading(true);

      await uploadDocs();

      try {
        await syncProfile({ bio });
      } catch (syncErr) {
        console.warn("[DoctorCredential] syncProfile warning:", syncErr);
      }

      setOnboardingComplete();
      completeSignUp();

      setSuccess(true);
      showToast("success", "Verification Complete!", "Redirecting to your dashboard...");

      setTimeout(() => router.replace("/(main)/home"), 1200);
    } catch (err: any) {
      console.error("[DoctorCredential] Submit error:", err);
      const serverMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong while uploading your credentials.";

      if (String(serverMessage).toLowerCase().includes("missing required file") || String(serverMessage).toLowerCase().includes("mcdnlicense")) {
        setGeneralError("Server did not receive the uploaded file. On web, please ensure you selected a file using the upload box. If the problem persists try a different browser.");
      } else if (String(serverMessage).toLowerCase().includes("network")) {
        setGeneralError("Network error when uploading. Ensure your device/emulator can reach the API (use ngrok or 10.0.2.2 for Android emulator).");
      } else {
        setGeneralError(serverMessage);
      }
      showToast("error", "Upload failed", serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        <View style={{ flex: 1, backgroundColor: colorScheme === "dark" ? "#0B0E11" : "#fff", padding: 16 }}>
          <View style={{ marginTop: 8 }}>
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/(auth)/signup/personalInfo");
              }}
              style={{
                height: 40,
                width: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colorScheme === "dark" ? "#2F343A" : "#E5E7EB",
              }}
            >
              <Feather name="arrow-left" size={22} color={colorScheme === "dark" ? "#fff" : "#111827"} />
            </Pressable>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colorScheme === "dark" ? "#fff" : "#0B1220" }}>
              Hi Doctor, Verify Your Medical Credentials
            </Text>
            <Text style={{ marginTop: 6, color: colorScheme === "dark" ? "#D1D5DB" : "#374151" }}>
              To protect our patients and maintain high standards, we require licensed practitioners to upload relevant documentation.
            </Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ marginBottom: 6, color: colorScheme === "dark" ? "#D1D5DB" : "#374151" }}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={(t) => {
                setBio(t);
                if (bioError) setBioError(null);
              }}
              placeholder="Enter your bio..."
              placeholderTextColor="#9CA3AF"
              multiline
              style={{
                minHeight: 100,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#2F343A",
                padding: 10,
                color: colorScheme === "dark" ? "#fff" : "#111827",
                backgroundColor: colorScheme === "dark" ? "#15191E" : "#fff",
              }}
            />
            {bioError ? <Text style={{ color: "#F87171", marginTop: 6 }}>{bioError}</Text> : null}
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={{ marginBottom: 8, color: colorScheme === "dark" ? "#D1D5DB" : "#374151" }}>
              Current MDCN Annual Practice License – Required
            </Text>

            <Pressable
              onPress={() => pickFile(setMdcnFile, true)}
              style={{
                minHeight: 120,
                borderWidth: 1,
                borderRadius: 8,
                borderStyle: "dashed",
                borderColor: "#2F343A",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colorScheme === "dark" ? "#0F1113" : "#fff",
                padding: 12,
              }}
            >
              <Feather name="upload-cloud" size={24} color="#9CA3AF" />
              <Text style={{ marginTop: 6, color: "#10B981" }}>Click to upload</Text>
              <Text style={{ color: "#9CA3AF" }}>PDF, PPT, XLS or JPG/PNG (max 5MB)</Text>
            </Pressable>

            {mdcnFile && (
              <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Feather name="file-text" size={18} color="#9CA3AF" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={{ color: colorScheme === "dark" ? "#fff" : "#111827" }}>{mdcnFile.name}</Text>
                    <Text style={{ color: "#9CA3AF", fontSize: 12 }}>{((mdcnFile.size ?? 0) / (1024 * 1024)).toFixed(1)} MB</Text>
                    <Text style={{ color: "#9CA3AF", fontSize: 11 }}>{`uri: ${String(mdcnFile.uri ?? "(none)")}`}</Text>
                  </View>
                </View>
                <Pressable onPress={() => { setMdcnFile(null); setMdcnError("Your current MDCN Annual Practice License is required."); }}>
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </Pressable>
              </View>
            )}
            {mdcnError ? <Text style={{ color: "#F87171", marginTop: 6 }}>{mdcnError}</Text> : null}
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={{ marginBottom: 8, color: colorScheme === "dark" ? "#D1D5DB" : "#374151" }}>
              Additional Qualification (optional)
            </Text>

            <Pressable
              onPress={() => pickFile(setAdditionalFile)}
              style={{
                minHeight: 120,
                borderWidth: 1,
                borderRadius: 8,
                borderStyle: "dashed",
                borderColor: "#2F343A",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colorScheme === "dark" ? "#0F1113" : "#fff",
                padding: 12,
              }}
            >
              <Feather name="upload-cloud" size={24} color="#9CA3AF" />
              <Text style={{ marginTop: 6, color: "#10B981" }}>Click to upload</Text>
              <Text style={{ color: "#9CA3AF" }}>PDF, PPT, XLS or JPG/PNG (max 5MB)</Text>
            </Pressable>

            {additionalFile && (
              <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Feather name="file-text" size={18} color="#9CA3AF" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={{ color: colorScheme === "dark" ? "#fff" : "#111827" }}>{additionalFile.name}</Text>
                    <Text style={{ color: "#9CA3AF", fontSize: 12 }}>{((additionalFile.size ?? 0) / (1024 * 1024)).toFixed(1)} MB</Text>
                  </View>
                </View>
                <Pressable onPress={() => setAdditionalFile(null)}>
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </Pressable>
              </View>
            )}
          </View>

          {generalError ? (
            <View style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: "#3F1622" }}>
              <Text style={{ color: "#FDEDEE" }}>{generalError}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 20, alignItems: "center" }}>
            <ButtonComponent
              title="Continue"
              onPress={handleContinue}
              loading={loading}
              disabled={!mdcnFile || loading}
              style={{ width: 328, borderRadius: 999 }}
            />
          </View>
        </View>
      </ScrollView>

      {Platform.OS === "web" && (
        <>
          <input
            ref={mdcnInputRef}
            type="file"
            accept={ALLOWED_MIME_TYPES.join(",")}
            style={{ display: "none" }}
            onChange={(e) => handleWebFileChange(e as any, setMdcnFile, true)}
          />
          <input
            ref={additionalInputRef}
            type="file"
            accept={ALLOWED_MIME_TYPES.join(",")}
            style={{ display: "none" }}
            onChange={(e) => handleWebFileChange(e as any, setAdditionalFile)}
          />
        </>
      )}

      {success && (
        <Animated.View entering={ZoomIn.duration(500)} exiting={ZoomOut.duration(300)} style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{ alignItems: "center" }}>
            <View style={{ marginBottom: 12, height: 80, width: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: "#10B981" }}>
              <Feather name="check" size={38} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>Verification Complete!</Text>
          </View>
        </Animated.View>
      )}

      <Toast />
    </Animated.View>
  );
}