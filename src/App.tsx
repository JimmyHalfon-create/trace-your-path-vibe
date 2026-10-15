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
// Local dev servers and the private Lovable editor preview also get the map for testing;
// the published site and custom domain stay locked to the presentation page.
const host = typeof window !== "undefined" ? window.location.hostname : "";
const isApp =
  Capacitor.isNativePlatform() ||
  host === "localhost" ||
  host === "127.0.0.1" ||
  host.startsWith("id-preview--") ||
  host.endsWith(".lovableproject.com");

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
