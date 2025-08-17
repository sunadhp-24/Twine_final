import React, { useEffect, useState } from "react";
import axios from "../services/api.js";
import moment from "moment";
import UpcomingEvents from "../components/UpcomingEvents";
import Header from "./Header.js";
import "../css/Events.css";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import UserDisplay from "../services/UserDisplay";

const Events = () => {
  const { user } = useSelector((state) => state.user);
  const [events, setEvents] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [relationshipUsers, setRelationshipUsers] = useState([]);
  const [newEvent, setNewEvent] = useState({
    event: "",
    dateOfEvent: "",
    category: "",
  });
  const { relationshipId } = useParams();

  useEffect(() => {
    const fetchEventsAndUsers = async () => {
      try {
        const eventsResponse = await axios.get(
          `/relationships/${relationshipId}/events`
        );
        setEvents(eventsResponse.data);

        const relationshipResponse = await axios.get(
          `/relationships/${relationshipId}`
        );
        setRelationshipUsers([
          relationshipResponse.data.relationship.user1,
          relationshipResponse.data.relationship.user2,
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchEventsAndUsers();
  }, [relationshipId, events]);

  const today = moment();

  const filteredEvents = events.filter((event) => {
    const eventDate = moment(event.date);
    const isWithinDateRange =
      (!startDate || eventDate.isSameOrAfter(startDate, "day")) &&
      (!endDate || eventDate.isSameOrBefore(endDate, "day"));
    const isCategoryMatch = !category || event.category === category;
    const isUserMatch = !selectedUser || event.createdBy === selectedUser;
    return isWithinDateRange && isCategoryMatch && isUserMatch;
  });

  const pastEvents = filteredEvents.filter((event) =>
    moment(event.date).isBefore(today, "day")
  );
  const upcomingEvents = filteredEvents.filter((event) =>
    moment(event.date).isSameOrAfter(today, "day")
  );

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setCategory("");
    setSelectedUser("");
  };

  const handleAddEvent = async () => {
    try {
      console.log(newEvent);
      const response = await axios.post(
        `/relationships/${relationshipId}/newEvent`,
        newEvent
      );
      setEvents((prevEvents) => [...prevEvents, response.data]);
      setNewEvent({ event: "", dateOfEvent: "", category: "" });
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  return (
    <div className="events-page">
      <Header />
      <div className="filters">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
          title="Start Date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
          title="End Date"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          title="Select Category"
        >
          <option value="">All Categories</option>
          <option value="sports">Sports</option>
          <option value="work">Work</option>
          <option value="study">Study</option>
          <option value="birthday">Birthday</option>
          <option value="anniversary">Anniversary</option>
          <option value="others">Others</option>
        </select>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          title="Select User"
        >
          <option value="">All Users</option>
          {relationshipUsers.map((userId) => (
            <option key={userId} value={userId}>
              <UserDisplay userId={userId} />
            </option>
          ))}
        </select>
        <button
          className="clear-filters-button"
          onClick={handleClearFilters}
          title="Clear Filters"
        >
          Clear Filters
        </button>
      </div>
      <div className="new-event">
        <input
          type="text"
          placeholder="Event Name"
          value={newEvent.event}
          onChange={(e) => setNewEvent({ ...newEvent, event: e.target.value })}
          title="Type Event Name"
        />
        <input
          type="date"
          value={newEvent.dateOfEvent}
          onChange={(e) =>
            setNewEvent({ ...newEvent, dateOfEvent: e.target.value })
          }
          title="Select Date"
        />
        <select
          value={newEvent.category}
          onChange={(e) =>
            setNewEvent({ ...newEvent, category: e.target.value })
          }
          title="Select Category"
        >
          <option value="">Select Category</option>
          <option value="sports">Sports</option>
          <option value="work">Work</option>
          <option value="study">Study</option>
          <option value="birthday">Birthday</option>
          <option value="anniversary">Anniversary</option>
          <option value="others">Others</option>
        </select>
        <button className="create-event-button" onClick={handleAddEvent}>
          Add Event
        </button>
      </div>
      <div className="event-container">
        <div className="upcoming-events-section">
          <UpcomingEvents
            events={upcomingEvents}
            relationshipId={relationshipId}
            mode="upcoming"
          />
        </div>
        <div className="past-events-section">
          <UpcomingEvents
            events={pastEvents}
            relationshipId={relationshipId}
            mode="past"
          />
        </div>
      </div>
    </div>
  );
};

export default Events;
