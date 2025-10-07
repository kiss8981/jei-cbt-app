import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";
import React from "react";
import "react-native-reanimated";

export default function MyPageLayout() {
  const isGlassAvailable = isLiquidGlassAvailable();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "홈",
        }}
      />
      <Stack.Screen
        name="webview"
        options={{
          headerTransparent: true,
          headerTintColor: "black",
          headerLargeStyle: { backgroundColor: "transparent" },
          headerBlurEffect: isGlassAvailable
            ? undefined
            : "systemMaterialLight",
        }}
      />
    </Stack>
  );
}
