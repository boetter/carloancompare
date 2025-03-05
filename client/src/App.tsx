import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

// Hjælpefunktion til at håndtere basen i vores URL'er
// Dette er nyttigt ved deployment på Netlify eller andre platforme
function useHashLocation() {
  const [location, setLocation] = useLocation();

  // Hvis vi ser URL'er med #, kan vi håndtere det her
  return [
    location,
    (to: string) => {
      setLocation(to);
    }
  ] as const;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
