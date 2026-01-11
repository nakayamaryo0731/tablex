import { useEffect } from "react";
import "./App.css";
import { Header, Sidebar, MainPanel, StatusBar } from "./components/layout";
import { useAiStore } from "./store/aiStore";
import { useConnectionStore } from "./store/connectionStore";

function App() {
  const loadSettings = useAiStore((state) => state.loadSettings);
  const checkConnectionStatus = useConnectionStore(
    (state) => state.checkConnectionStatus
  );

  useEffect(() => {
    loadSettings();
    checkConnectionStatus();
  }, [loadSettings, checkConnectionStatus]);

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainPanel />
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
