import React from "react";
import { View, Text, Image, Pressable, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import ButtonComponent from "@/components/ButtonComponent";
export default function SignIn() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleSignIn = () => {
    console.log("Signed in!!!");
  };
  return (
    <View>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Text
        className={`text-4xl ${isDark ? "text-text-secondaryDark" : "text-text-secondaryLight"} `}
      >
        This signin page is still under construction! 🚫
      </Text>
      <ButtonComponent onPress={handleSignIn} />
    </View>
  );
}
