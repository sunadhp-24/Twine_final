import React, { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "../services/api.js";

const ProtectedRoute = ({ children }) => {
  const { relationshipId } = useParams();
  const { user: currentUser } = useSelector((state) => state.user);
  const [isAuthorized, setIsAuthorized] = useState(null); // Use null for loading state

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!relationshipId || !currentUser) {
        setIsAuthorized(false);
        return;
      }

      try {
        // Fetch the relationship details from the backend
        const res = await axios.get(`/relationships/${relationshipId}`);
        const relationship = res.data.relationship;

        // Check if the current user is part of the relationship
        if (
          relationship.user1 === currentUser._id ||
          relationship.user2 === currentUser._id
        ) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Authorization check failed:", error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, [relationshipId, currentUser]);

  // Show a loading indicator while checking
  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  // If authorized, render the page. If not, redirect to home.
  return isAuthorized ? children : <Navigate to="/home" />;
};

export default ProtectedRoute;
