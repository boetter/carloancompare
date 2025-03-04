import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { queryClient } from "./lib/queryClient";
import "./index.css";

// Tilføj fejlhåndtering til vinduet for at fange alle ubehandlede fejl
window.addEventListener('error', (event) => {
  console.error('Global fejl fanget:', event.error);
});

// Tilføj fejlhåndtering til ubehandlede promise-afvisninger
window.addEventListener('unhandledrejection', (event) => {
  console.error('Ubehandlet Promise-afvisning:', event.reason);
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
