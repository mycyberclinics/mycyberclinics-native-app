import React from "react";
import { View, Text, Image, Pressable, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className={`flex-1 px-6 ${isDark ? "bg-[#0B0E11]" : "bg-white"}`}>
      <StatusBar style={isDark ? "light" : "dark"} />


      <View className="flex-row items-center justify-between mt-2">

        <View className="flex-row space-x-1">
          <View className="w-4 h-2 rounded-full bg-sky-400" />
          <View
            className={`h-2 w-2 rounded-full ${
              isDark ? "bg-gray-600" : "bg-gray-300"
            }`}
          />
          <View
            className={`h-2 w-2 rounded-full ${
              isDark ? "bg-gray-600" : "bg-gray-300"
            }`}
          />
        </View>


        <Pressable>
          <Text
            className={`text-sm font-semibold ${
              isDark ? "text-sky-400" : "text-blue-500"
            }`}
          >
            Skip
          </Text>
        </Pressable>
      </View>

 
      <View className="items-center mt-8">
        <View className="relative">
 
          <Image
            source={require("@/assets/images/onboarding1.png")}
            className="w-72 h-72 rounded-3xl"
            resizeMode="cover"
          />

     
          <View className="absolute bottom-4 right-4 w-[146px] h-[100px] rounded-2xl overflow-hidden border-4 border-white">
            <Image
              source={require("@/assets/images/onboarding2.png")}
              className="w-full h-full "
              resizeMode="contain"
            />
          </View>
        </View>
      </View>


      <View className="items-center mt-10">
        <Text
          className={`text-2xl font-bold text-center ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Get Healthcare,{"\n"}Wherever You Are
        </Text>

        <Text
          className={`text-sm text-center mt-3 leading-5 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Licensed doctors and specialists are just a tap away, from the comfort
          of your home.
        </Text>
      </View>


      <View className="mt-auto mb-6 space-y-4">
        <Pressable className="py-4 rounded-full bg-emerald-500 active:opacity-80">
          <Text className="text-base font-semibold text-center text-white">
            Continue
          </Text>
        </Pressable>

        <Pressable
          className={`rounded-full py-4 ${
            isDark ? "bg-[#1C1F23]" : "bg-gray-200"
          } active:opacity-80`}
        >
          <Text
            className={`text-center font-semibold text-base ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Sign In
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
