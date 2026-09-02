import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import CafePage from "./pages/CafePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CategoryPage from "./pages/CategoryPage";
import Admin from "./pages/Admin";
import CafeDetails from "./components/CafeDetails";
import Profile from "./pages/Profile";

// Leaflet et sa feuille de style pèsent plus lourd que le reste du guide réuni.
// La carte est une page parmi d'autres : elle ne se charge que si on y va.
const MapPage = lazy(() => import("./pages/MapPage"));

function getTokenPayload() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

function AdminRoute({ children }) {
  const payload = getTokenPayload();
  if (!payload) return <Navigate to="/login" replace />;
  if (payload.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function App() {

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-(--background)">

        <Navbar />

        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cafes" element={<CafePage />} />
            <Route path="/cafe/:id" element={<CafeDetails />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route
              path="/map"
              element={
                <Suspense fallback={<p className="p-8 text-(--text-secondary)">Chargement de la carte…</p>}>
                  <MapPage />
                </Suspense>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
