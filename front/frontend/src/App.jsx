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
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

// Leaflet et sa feuille de style pèsent plus lourd que le reste du guide réuni.
// La carte est une page parmi d'autres : elle ne se charge que si on y va.
const MapPage = lazy(() => import("./pages/MapPage"));

function AdminRoute({ children }) {
  const { chargement, connecte, estAdmin } = useAuth();

  // Tant que le profil n'est pas revenu de l'API, on ne sait pas encore si la
  // personne a le droit d'être là : rediriger tout de suite éjecterait un
  // administrateur légitime à chaque rechargement.
  if (chargement) return <p className="p-8 text-corps text-gris">On Vérifie Vos Droits…</p>;
  if (!connecte) return <Navigate to="/login" replace />;
  if (!estAdmin) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Pas de couleur de fond ici : `body` porte déjà `--color-papier`.
            L'ancien `bg-(--background)` visait un jeton qui n'existe pas et ne
            produisait donc rien — un jeton qui ment sur son nom. */}
        <div className="flex min-h-screen flex-col">
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
                  <Suspense fallback={<div className="squelette m-6 h-96" />}>
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
    </AuthProvider>
  )
}

export default App
