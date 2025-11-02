import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function TabLayout() {
  const isGlassAvailable = isLiquidGlassAvailable();
  return (
    <SafeAreaProvider>
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
            headerTransparent: isGlassAvailable ? true : false,
            headerTintColor: "black",
            headerLargeStyle: { backgroundColor: "transparent" },
            headerBlurEffect: isGlassAvailable
              ? undefined
              : "systemMaterialLight",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
