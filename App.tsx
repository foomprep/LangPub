import { Button, SafeAreaView, useWindowDimensions } from 'react-native';
import { Reader, ReaderProvider, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const ReaderComponent = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { injectJavascript } = useReader();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <ReaderProvider>
        <Reader
          src="https://s3.amazonaws.com/moby-dick/OPS/package.opf"
          width={width}
          height={height}
          fileSystem={useFileSystem}
          injectedJavascript={`
            document.addEventListener('click', (e) => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "click", message: "document clicked" }));
            });
          `}
          onWebViewMessage={(message) => console.log(message)}
        />
      </ReaderProvider>
    </SafeAreaView>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ReaderComponent />
    </SafeAreaProvider>
  );
};

export default App;
