import WebViewContainer from "@/components/WebViewConatiner";

export default function HomeScreen() {
  return (
    <WebViewContainer
      baseURL={process.env.EXPO_PUBLIC_WEBVIEW_URL! + "/auth/me"}
    />
  );
}
