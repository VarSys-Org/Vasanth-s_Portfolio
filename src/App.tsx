import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ContentProvider } from "./content/ContentProvider";

// The admin is a separate chunk; visitors never download it.
const AdminApp = lazy(() => import("./admin/AdminApp"));

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<ContentProvider><Index /></ContentProvider>} />
      <Route path="/admin/*" element={<Suspense fallback={<RouteSkeleton />}><AdminApp /></Suspense>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

function RouteSkeleton() {
  return (
    <main className="pf-route-skeleton" role="status" aria-live="polite" aria-label="Loading admin workspace">
      <span className="pf-route-skeleton__bar pf-route-skeleton__bar--title" />
      <span className="pf-route-skeleton__bar pf-route-skeleton__bar--intro" />
      <div className="pf-route-skeleton__grid" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => <span className="pf-route-skeleton__card" key={index} />)}
      </div>
      <span className="pf-sr-only">Loading admin workspace</span>
    </main>
  );
}

export default App;
