import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";

export default function TabLayout() {
  const isGlassAvailable = isLiquidGlassAvailable();
  return (
    <Stack initialRouteName="(tabs)">
      <Stack.Screen
        name="(tabs)"
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
