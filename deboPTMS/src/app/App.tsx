import { AuthProvider } from "./context/AuthContext";
import { AppRouter } from "./routes";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
      <Toaster />
    </>
  );
}