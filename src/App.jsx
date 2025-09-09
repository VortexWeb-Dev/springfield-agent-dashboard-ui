import { useEffect, useState } from "react";
import AgentDashboard from "./pages/Main";

function App() {
  const [user, setUser] = useState(null);
  const [bitrixReady, setBitrixReady] = useState(false);
  const [error, setError] = useState(null);

  const isInsideBitrix = () => {
    try {
      return window !== window.parent;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!isInsideBitrix()) {
      setError("This app can only be used inside Bitrix24.");
      return;
    }

    const loadBitrix = async () => {
      try {
        const $logger = window.B24Js.LoggerBrowser.build("local-app", true);
        const $b24 = await window.B24Js.initializeB24Frame();
        $b24.setLogger(window.B24Js.LoggerBrowser.build("Core"));

        $logger.warn("Bitrix24 Frame initialized");

        const response = await $b24.callMethod("user.current");
        const userData = response.getData().result;

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setBitrixReady(true);

        console.log("Bitrix24 user loaded:", userData);
      } catch (err) {
        console.error("Failed to initialize Bitrix24 SDK:", err);
        setError("Failed to initialize Bitrix24 SDK.");
      }
    };

    // load SDK if not already present
    if (!window.B24Js) {
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/@bitrix24/b24jssdk@latest/dist/umd/index.min.js";
      script.onload = loadBitrix;
      script.onerror = () => setError("Failed to load Bitrix SDK.");
      document.body.appendChild(script);
    } else {
      loadBitrix();
    }
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  if (!bitrixReady || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading Bitrix24...
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-screen">
      <AgentDashboard user={user} />
    </div>
  );
}

export default App;
