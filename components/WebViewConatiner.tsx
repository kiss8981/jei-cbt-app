import { useAuth } from "@/hooks/useAuth";
import { WebviewEventMessage } from "@/types/webview/event";
import { useHeaderHeight } from "@react-navigation/elements";
import { StackActions, useNavigation } from "@react-navigation/native";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useLayoutEffect } from "react"; // useLayoutEffect를 import
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export const injectedJavaScript = (
  insets: EdgeInsets,
  opts: {
    debug?: boolean;
    headerHeight?: number;
    overlayHeader?: boolean;
    isGlassAvailable?: boolean;
  } = {}
) => {
  const debug = !!opts.debug;

  const top = opts.isGlassAvailable ? opts.headerHeight || 0 : 0;
  const right = insets.right || 0;
  const bottom = insets.bottom || 0;
  const left = insets.left || 0;

  // 주입 문자열
  return `
    (function() {
      var DEBUG = ${debug ? "true" : "false"};

      // 1) safe-area CSS 변수 세팅
      var s = document.documentElement && document.documentElement.style;
      if (s) {
        s.setProperty('--safe-area-inset-top',    '${top}px');
        s.setProperty('--safe-area-inset-right',  '${right}px');
        s.setProperty('--safe-area-inset-bottom', '${bottom}px');
        s.setProperty('--safe-area-inset-left',   '${left}px');
      }

      // 2) viewport-fit=cover 보강 (env() 기본 동작 확보)
      try {
        var vp = document.querySelector('meta[name="viewport"]');
        if (!vp) {
          vp = document.createElement('meta');
          vp.setAttribute('name', 'viewport');
          document.head.appendChild(vp);
        }
        var content = vp.getAttribute('content') || 'width=device-width, initial-scale=1';
        if (!/viewport-fit=cover/.test(content)) {
          content += ', viewport-fit=cover';
          vp.setAttribute('content', content);
        }
      } catch (e) {}

      // 3) TITLE 업데이트: 초기 + 변경 감시 + SPA 라우팅
      function postTitle() {
        if (!window.ReactNativeWebView) return;
        var title = document.title || '';
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'TITLE_UPDATE',
          title: title
        }));
      }
      // 초기 전송
      postTitle();

      // <title> 변경 감시
      (function observeTitle() {
        var t = document.querySelector('title');
        if (t && window.MutationObserver) {
          var mo = new MutationObserver(function() { postTitle(); });
          mo.observe(t, { childList: true });
        }
      })();

      // SPA history 훅킹
      ['pushState','replaceState'].forEach(function(k){
        try {
          var orig = history[k];
          history[k] = function() {
            var r = orig.apply(this, arguments);
            setTimeout(postTitle, 0);
            return r;
          };
        } catch(e){}
      });

      // 회전/리사이즈 때 재주입(값 동일해도 안전차원)
      window.addEventListener('resize', function(){
        if (!s) return;
        s.setProperty('--safe-area-inset-top',    '${top}px');
        s.setProperty('--safe-area-inset-right',  '${right}px');
        s.setProperty('--safe-area-inset-bottom', '${bottom}px');
        s.setProperty('--safe-area-inset-left',   '${left}px');
      });

      // ===== 디버그(값 확인 + 오버레이 시각화) =====
      function readVar(name) {
        return getComputedStyle(document.documentElement)
          .getPropertyValue(name).trim() || '0px';
      }

      function debugAlert() {
        var msg = '[SAFE-AREA VARS]\\n' +
                  'top: '    + readVar('--safe-area-inset-top')    + '\\n' +
                  'right: '  + readVar('--safe-area-inset-right')  + '\\n' +
                  'bottom: ' + readVar('--safe-area-inset-bottom') + '\\n' +
                  'left: '   + readVar('--safe-area-inset-left');
        console.log(msg);
        try { alert(msg); } catch (e) {}
      }

      function mountOverlay() {
        if (document.getElementById('safe-area-debug-overlay')) return;

        var overlay = document.createElement('div');
        overlay.id = 'safe-area-debug-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '2147483647';
        overlay.style.fontFamily = 'system-ui, sans-serif';

        var topBar = document.createElement('div');
        var rightBar = document.createElement('div');
        var bottomBar = document.createElement('div');
        var leftBar = document.createElement('div');

        [topBar, rightBar, bottomBar, leftBar].forEach(function (bar) {
          bar.style.position = 'fixed';
          bar.style.background = 'rgba(0, 128, 255, 0.25)';
          bar.style.backdropFilter = 'blur(2px)';
        });

        topBar.style.top = '0';
        topBar.style.left = '0';
        topBar.style.right = '0';
        topBar.style.height = 'var(--safe-area-inset-top, 0px)';

        rightBar.style.top = '0';
        rightBar.style.right = '0';
        rightBar.style.bottom = '0';
        rightBar.style.width = 'var(--safe-area-inset-right, 0px)';

        bottomBar.style.left = '0';
        bottomBar.style.right = '0';
        bottomBar.style.bottom = '0';
        bottomBar.style.height = 'var(--safe-area-inset-bottom, 0px)';

        leftBar.style.top = '0';
        leftBar.style.left = '0';
        leftBar.style.bottom = '0';
        leftBar.style.width = 'var(--safe-area-inset-left, 0px)';

        function makeLabel(text, pos) {
          var label = document.createElement('div');
          label.textContent = text;
          label.style.position = 'fixed';
          label.style.padding = '4px 6px';
          label.style.background = 'rgba(0,0,0,0.6)';
          label.style.color = '#fff';
          label.style.fontSize = '11px';
          label.style.borderRadius = '4px';
          label.style.pointerEvents = 'none';
          label.style.zIndex = '2147483647';
          Object.assign(label.style, pos);
          return label;
        }

        var topLbl    = makeLabel('top: '    + readVar('--safe-area-inset-top'),    { top: '4px',  left: '4px' });
        var rightLbl  = makeLabel('right: '  + readVar('--safe-area-inset-right'),  { top: '4px',  right: '4px' });
        var bottomLbl = makeLabel('bottom: ' + readVar('--safe-area-inset-bottom'), { bottom: '4px', left: '4px' });
        var leftLbl   = makeLabel('left: '   + readVar('--safe-area-inset-left'),   { bottom: '4px', right: '4px' });

        overlay.appendChild(topBar);
        overlay.appendChild(rightBar);
        overlay.appendChild(bottomBar);
        overlay.appendChild(leftBar);
        overlay.appendChild(topLbl);
        overlay.appendChild(rightLbl);
        overlay.appendChild(bottomLbl);
        overlay.appendChild(leftLbl);

        document.body.appendChild(overlay);
      }

      // 디버그 on 조건: (1) RN에서 debug=true 주입 OR (2) URL ?debugSafeArea=1
      var urlDebug = false;
      try {
        urlDebug = new URLSearchParams(location.search).get('debugSafeArea') === '1';
      } catch(e) {}

      if (DEBUG || urlDebug) {
        debugAlert();
        mountOverlay();
        // var 값이 변하면 라벨 갱신되도록 리사이즈 때 다시 붙임
        window.addEventListener('resize', function() {
          var o = document.getElementById('safe-area-debug-overlay');
          if (o) { o.remove(); }
          mountOverlay();
        });
      }
    })();
    true;
  `;
};

export default function WebViewContainer({ baseURL }: { baseURL: string }) {
  const navigation = useNavigation();
  const { saveToken, deleteToken, getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const isGlassAvailable = isLiquidGlassAvailable();

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

  const injectedJS = injectedJavaScript(insets, {
    debug: false,
    headerHeight,
    isGlassAvailable,
  });

  return (
    <WebView
      allowsBackForwardNavigationGestures={true}
      bounces={false}
      source={{
        uri: baseURL,
      }}
      onMessage={requestOnMessage}
      injectedJavaScript={injectedJS}
      style={{ flex: 1 }}
      sharedCookiesEnabled
    />
  );
}
