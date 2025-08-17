import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Journal from "./pages/Journal.js";
import Events from "./pages/Events.js";
import ProfilePage from "./pages/profilePage.js";
import Chat from "./pages/Chat.js";
import ProtectedRoute from "./components/ProtectedRoute"; // Import the new component

function App() {
  const { user } = useSelector((state) => state.user);

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* --- PROTECTED ROUTES --- */}
        <Route
          path="/journal/:relationshipId"
          element={
            <ProtectedRoute>
              <Journal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/importantEvents/:relationshipId"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:relationshipId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
