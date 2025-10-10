import WebViewContainer from "@/components/WebViewConatiner";

export default function Page() {
  return <WebViewContainer baseURL={process.env.EXPO_PUBLIC_WEBVIEW_URL!} />;
}
