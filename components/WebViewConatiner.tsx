import { useAuth } from "@/hooks/useAuth";
import { WebviewEventMessage } from "@/types/webview/event";
import { StackActions, useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect } from "react"; // useLayoutEffect를 import
import { WebView, WebViewMessageEvent } from "react-native-webview";

// 웹뷰에서 title을 추출하여 Native로 전달하는 JavaScript
const injectedJavaScript = `
  (function() {
    // 0.5초마다 document.title을 확인하고 Native로 전송
    const interval = setInterval(() => {
      if (document.title) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'TITLE_UPDATE',
          title: document.title,
        }));
        clearInterval(interval); // 한 번 전송 후 인터벌 클리어
      }
    }, 500);

    // 페이지가 완전히 로드된 후에도 한 번 더 확인 (혹시 모를 경우)
    window.onload = function() {
      if (document.title) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'TITLE_UPDATE',
          title: document.title,
        }));
        clearInterval(interval);
      }
    };
  })();
  true; // 마지막 값은 string이 아니어야 함
`;

export default function WebViewContainer({ baseURL }: { baseURL: string }) {
  const navigation = useNavigation();
  const { saveToken, deleteToken, getToken } = useAuth();

  // 헤더 타이틀을 업데이트하는 함수를 useLayoutEffect 내에서 사용하기 위해 별도로 정의
  const setHeaderTitle = React.useCallback(
    (title: string) => {
      navigation.setOptions({
        headerTitle: title, // title 옵션을 업데이트
      });
    },
    [navigation]
  );

  useLayoutEffect(() => {
    setHeaderTitle("");
  }, []);

  const requestOnMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as WebviewEventMessage;
      if (message.type === "ROUTER_EVENT") {
        const { method, path, screenName, data } = message;
        switch (method) {
          case "PUSH":
            navigation.dispatch(
              StackActions.push(screenName ?? "webview", {
                url: path,
                ...data,
              })
            );
            break;
          case "REPLACE":
            navigation.dispatch(
              StackActions.replace(screenName ?? "webview", {
                url: path,
                ...data,
              })
            );
            break;
          case "RESET":
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: (screenName ?? "webview") as never,
                  params: { url: path, ...data },
                },
              ],
            });
            break;
          case "GO_BACK":
            navigation.goBack();
            break;
          case "GO_FORWARD":
            // forward는 history 관리 직접 해야해서 (생략)
            break;
        }
      } else if (message.type === "TITLE_UPDATE" && message.title) {
        // 웹뷰에서 제목을 수신하면 헤더 타이틀 업데이트
        setHeaderTitle(message.title);
      } else if (message.type === "AUTH_EVENT") {
        const { accessToken, refreshToken, method } = message;
        if (method == "LOGIN" || method == "REFRESH_TOKEN") {
          console.log("Tokens saved from WebView", message);

          saveToken(accessToken!, refreshToken!);
        } else if (method == "LOGOUT") {
          deleteToken();
        }
      }
    } catch (err) {
      console.warn("Invalid message format", err);
    }
  };

  return (
    <WebView
      allowsBackForwardNavigationGestures={true}
      bounces={false}
      source={{
        uri: baseURL,
      }}
      onMessage={requestOnMessage}
      injectedJavaScript={injectedJavaScript} // JavaScript 주입
      style={{ flex: 1 }}
      sharedCookiesEnabled
    />
  );
}
