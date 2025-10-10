import WebViewContainer from "@/components/WebViewConatiner";
import { useLocalSearchParams } from "expo-router";

export default function WebViewScreen() {
  const { url } = useLocalSearchParams();

  return (
    <WebViewContainer baseURL={process.env.EXPO_PUBLIC_WEBVIEW_URL! + url} />
  );
}
