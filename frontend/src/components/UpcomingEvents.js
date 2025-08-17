import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faBriefcase,
  faBookOpen,
  faBirthdayCake,
  faHeart,
  faQuestion,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import UserDisplay from "../services/UserDisplay";
import "../css/Events.css";
import axios from "../services/api.js";
import { useSelector } from "react-redux";

const categoryIcons = {
  sports: faFutbol,
  work: faBriefcase,
  study: faBookOpen,
  birthday: faBirthdayCake,
  anniversary: faHeart,
  others: faQuestion,
};

const UpcomingEvents = ({ events, relationshipId, mode }) => {
  const { user } = useSelector((state) => state.user);
  const [editEventId, setEditEventId] = useState(null);
  const [editText, setEditText] = useState("");

  const sortedEvents = events.sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const handleEdit = (eventId, currentText) => {
    setEditEventId(eventId);
    setEditText(currentText);
  };

  const handleUpdate = async (eventId) => {
    try {
      await axios.put(`/relationships/${relationshipId}/event/${eventId}`, {
        event: editText,
      });
      // Optionally, refresh or update events list here
      setEditEventId(null);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleDelete = async (eventId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this event?"
      );
      if (confirmed) {
        await axios.delete(`/relationships/${relationshipId}/event/${eventId}`);
      }
      // Optionally, refresh or update events list here
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="upcoming-events">
      {mode === "upcoming" ? <h3>Upcoming Events</h3> : <h3>Past Events</h3>}
      {sortedEvents.length > 0 ? (
        sortedEvents.map((event) => (
          <div key={event._id} className="event">
            <div className="event-line"></div>
            <div className="event-icon-container">
              <FontAwesomeIcon
                icon={categoryIcons[event.category] || faQuestion}
                className="event-icon"
              />
            </div>
            <div className="event-info">
              <div className="event-date">
                {moment(event.date).format("MMM DD, YYYY")}
              </div>
              <div className="event-details">
                <div className="event-description">
                  <span className="event-createdBy">
                    <UserDisplay userId={event.createdBy} />
                  </span>
                  {editEventId === event._id ? (
                    <>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <button onClick={() => handleUpdate(event._id)}>
                        Save
                      </button>
                    </>
                  ) : (
                    <div className="event-event">{event.event}</div>
                  )}
                </div>
              </div>
              <div className="event-actions">
                {mode === "upcoming" && user._id === event.createdBy ? (
                  <FontAwesomeIcon
                    icon={faPen}
                    className="edit-icon"
                    onClick={() => handleEdit(event._id, event.event)}
                  />
                ) : null}
                {user._id === event.createdBy ? (
                  <FontAwesomeIcon
                    icon={faTrash}
                    className="delete-icon"
                    onClick={() => handleDelete(event._id)}
                  />
                ) : null}
              </div>
            </div>
          </div>
        ))
      ) : mode === "upcoming" ? (
        <p>No upcoming events.</p>
      ) : (
        <p>No past events.</p>
      )}
    </div>
  );
};

export default UpcomingEvents;
