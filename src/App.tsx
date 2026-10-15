import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import { Capacitor } from "@capacitor/core";

// The map app only runs inside the native iOS/Android app; the web shows a presentation page.
// Local dev servers (localhost) also get the map so changes can be tested in a browser.
const isApp =
  Capacitor.isNativePlatform() ||
  typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const App = () => (
  <ErrorBoundary>
    <Toaster position="top-center" theme="dark" />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isApp ? <Index /> : <Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
