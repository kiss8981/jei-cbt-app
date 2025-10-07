import { Stack } from "expo-router";
import React from "react";
import "react-native-reanimated";

export default function MyPageLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
