// UserDisplay.js
import React, { useState, useEffect } from "react";
import axios from "./api.js";

const UserDisplay = ({ userId }) => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await axios.get(`/auth/users/${userId}`);
        setUserName(response.data.name);
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };

    fetchUserName();
  }, [userId]);

  return <span>{userName}</span>;
};

export default UserDisplay;
