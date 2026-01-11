import { useEffect } from "react";
import "./App.css";
import { Header, StatusBar, ResizableLayout } from "./components/layout";
import { useAiStore } from "./store/aiStore";
import { useConnectionStore } from "./store/connectionStore";

function App() {
  const loadSettings = useAiStore((state) => state.loadSettings);
  const checkConnectionStatus = useConnectionStore(
    (state) => state.checkConnectionStatus
  );
  const getDefaultConnection = useConnectionStore(
    (state) => state.getDefaultConnection
  );
  const connectToSaved = useConnectionStore((state) => state.connectToSaved);
  const isConnected = useConnectionStore((state) => state.isConnected);

  useEffect(() => {
    loadSettings();
    checkConnectionStatus();
  }, [loadSettings, checkConnectionStatus]);

  // Auto-connect to default connection on startup
  useEffect(() => {
    const autoConnect = async () => {
      // Only auto-connect if not already connected
      if (isConnected) return;

      const defaultConnection = await getDefaultConnection();
      if (defaultConnection) {
        try {
          await connectToSaved(defaultConnection);
        } catch (error) {
          console.error("Failed to auto-connect:", error);
        }
      }
    };

    autoConnect();
  }, [isConnected, getDefaultConnection, connectToSaved]);

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Header />
      <ResizableLayout />
      <StatusBar />
    </div>
  );
}

export default App;
