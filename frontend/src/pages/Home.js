import React, { useState, useEffect } from "react";
import axios from "../services/api.js"; // Import Axios for API calls
import { useSelector } from "react-redux";
import Header from "./Header";
import "../css/Home.css"; // Import the CSS file
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTrash,
  faCaretDown,
  faPlus,
  faCalendarAlt,
  faBook,
  faHandshake,
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useSelector((state) => state.user);
  const [tagFilter, setTagFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [relationships, setRelationships] = useState([]);
  const [filteredRelationships, setFilteredRelationships] = useState([]);
  const [users, setUsers] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null); // State for active dropdown
  const [isCreating, setIsCreating] = useState(false); // State for creating new relationship
  const [newRelationship, setNewRelationship] = useState({
    name: "",
    tag: "friend",
  });
  const [error, setError] = useState(null); // State for error messages

  const tags = ["friend", "lover", "family", "colleague", "others", "all"];
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch relationships from the backend
    const fetchRelationships = async () => {
      try {
        const res = await axios.get("/relationships");
        setRelationships(res.data);
      } catch (error) {
        console.error("Error fetching relationships:", error);
      }
    };

    fetchRelationships();
  }, []);

  useEffect(() => {
    // Filter relationships based on the selected tag and search query
    const filterRelationships = () => {
      let filtered = relationships;

      if (tagFilter !== "all") {
        filtered = filtered.filter((rel) => rel.tag === tagFilter);
      }

      if (searchQuery) {
        filtered = filtered.filter((rel) => {
          const otherUserId = rel.user1 === user._id ? rel.user2 : rel.user1;
          const otherUser = users[otherUserId];
          return (
            otherUser &&
            otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        });
      }

      setFilteredRelationships(filtered);
    };

    filterRelationships();
  }, [tagFilter, searchQuery, relationships, users, user._id]);

  useEffect(() => {
    const fetchUserDetails = async (userId) => {
      if (!users[userId]) {
        try {
          const res = await axios.get(`/auth/users/${userId}`);
          setUsers((prevUsers) => ({
            ...prevUsers,
            [userId]: res.data,
          }));
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
    };

    filteredRelationships.forEach((relationship) => {
      const otherUserId =
        relationship.user1 === user._id
          ? relationship.user2
          : relationship.user1;
      fetchUserDetails(otherUserId);
    });
  }, [filteredRelationships, user._id, users]);

  const deleteRelationship = async (relationshipId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this relationship?"
    );
    if (confirmed) {
      try {
        await axios.delete(`/relationships/${relationshipId}`);
        setRelationships(
          relationships.filter((rel) => rel._id !== relationshipId)
        );
      } catch (error) {
        console.error("Error deleting relationship:", error);
      }
    }
  };

  const updateRelationshipTag = async (relationshipId, newTag) => {
    try {
      await axios.put(`/relationships/${relationshipId}`, { tag: newTag });
      setRelationships(
        relationships.map((rel) =>
          rel._id === relationshipId ? { ...rel, tag: newTag } : rel
        )
      );
    } catch (error) {
      console.error("Error updating relationship tag:", error);
    }
  };

  const createNewRelationship = async () => {
    try {
      console.log(
        `Creating new relationship at URL: ${axios.defaults.baseURL}/relationships/create`
      );
      const res = await axios.post("/relationships/create", {
        user2Username: newRelationship.name,
        tag: newRelationship.tag,
      });
      setRelationships([...relationships, res.data]);
      setIsCreating(false);
      setNewRelationship({ name: "", tag: "friend" });
      setError(null); // Clear any existing errors
      alert("notification sent");
    } catch (error) {
      console.error("Error creating new relationship:", error);
      if (error.response) {
        if (error.response.status === 404) {
          setError("User doesn't exist");
        } else if (error.response.status === 400) {
          setError("Relationship already exists");
        } else {
          setError("An unexpected error occurred");
        }
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const renderRelationship = (relationship) => {
    const otherUserId =
      relationship.user1 === user._id ? relationship.user2 : relationship.user1;
    const otherUser = users[otherUserId];

    if (!otherUser) {
      return null; // Or a loading indicator
    }

    return (
      <div key={relationship._id} className="relationship-card">
        <img
          src={`http://localhost:5000/public/avatars/${otherUser.avatar}`}
          alt={otherUser.name}
        />
        <div className="relationship-name">{otherUser.name}</div>
        <div
          className="relationship-tag"
          onMouseLeave={() => setActiveDropdown(null)} // Close dropdown when mouse leaves
        >
          {relationship.tag.charAt(0).toUpperCase() + relationship.tag.slice(1)}
          <FontAwesomeIcon
            icon={faCaretDown}
            className="tag-dropdown-icon"
            onClick={() => setActiveDropdown(relationship._id)}
          />
          {activeDropdown === relationship._id && (
            <select
              className="tag-dropdown"
              value={relationship.tag}
              onChange={(e) => {
                updateRelationshipTag(relationship._id, e.target.value);
                setActiveDropdown(null);
              }}
              onMouseLeave={() => setActiveDropdown(null)} // Close dropdown when mouse leaves
            >
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          className="delete-button"
          onClick={() => deleteRelationship(relationship._id)}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
        <div className="icon-container">
          <FontAwesomeIcon
            icon={faComments} // Changed from faHandshake
            className="info-icon"
            title={`Chat with ${otherUser.name}`}
            onClick={() => navigate(`/chat/${relationship._id}`)} // Navigate to chat
          />

          <FontAwesomeIcon
            icon={faBook}
            className="info-icon"
            title="Journal"
            onClick={() => navigate(`/journal/${relationship._id}`)}
          />
        </div>
      </div>
    );
  };

  const renderNewRelationshipCard = () => {
    if (isCreating) {
      return (
        <div className="relationship-card create-card">
          {error ? (
            <div className="error-message">
              {error}
              <button
                onClick={() => {
                  setError(null);
                  setIsCreating(false);
                  setNewRelationship({ name: "", tag: "friend" });
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Name"
                value={newRelationship.name}
                onChange={(e) =>
                  setNewRelationship({
                    ...newRelationship,
                    name: e.target.value,
                  })
                }
              />
              <select
                value={newRelationship.tag}
                onChange={(e) =>
                  setNewRelationship({
                    ...newRelationship,
                    tag: e.target.value,
                  })
                }
              >
                {tags.map((tag) =>
                  tag !== "all" ? (
                    <option key={tag} value={tag}>
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </option>
                  ) : null
                )}
              </select>
              <button onClick={createNewRelationship}>Create</button>
            </>
          )}
        </div>
      );
    }

    return (
      <div
        className="relationship-card create-card"
        onClick={() => setIsCreating(true)}
      >
        <FontAwesomeIcon icon={faPlus} className="plus-icon" />
        <div>Create New</div>
      </div>
    );
  };

  return (
    <div className="home-container">
      <Header />
      <div className="home-content">
        <div className="filter-search-section">
          <div className="filter-section">
            <label>Select Tag:</label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="search-section">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="relationships-container">
          {filteredRelationships.map((relationship) =>
            renderRelationship(relationship)
          )}
          {renderNewRelationshipCard()}
        </div>
      </div>
    </div>
  );
};

export default Home;
