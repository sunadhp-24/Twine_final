import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFutbol,
  faBriefcase,
  faBookOpen,
  faBirthdayCake,
  faHeart,
  faQuestion,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import UserDisplay from "../services/UserDisplay";
import "../css/Events.css";
import axios from "../services/api.js";

const categoryIcons = {
  sports: faFutbol,
  work: faBriefcase,
  study: faBookOpen,
  birthday: faBirthdayCake,
  anniversary: faHeart,
  others: faQuestion,
};

const PastEvents = ({ events, relationshipId }) => {
  const sortedEvents = events.sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const handleDelete = async (eventId) => {
    try {
      await axios.delete(`/relationships/${relationshipId}/${eventId}`);
      // Optionally, refresh or update events list here
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="past-events">
      <h3>Past Events</h3>
      {sortedEvents.length > 0 ? (
        sortedEvents.map((event) => (
          <div key={event._id} className="event">
            <div className="event-line"></div>
            <div className="event-circle">
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
                  <div>{event.event}</div>
                </div>
              </div>
              <div className="event-actions">
                <FontAwesomeIcon
                  icon={faTrash}
                  className="delete-icon"
                  onClick={() => handleDelete(event._id)}
                />
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>No past events.</p>
      )}
    </div>
  );
};

export default PastEvents;
