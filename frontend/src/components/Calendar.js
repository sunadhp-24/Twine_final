import React, { useState, useEffect, useRef } from "react";
import axios from "../services/api.js";
import moment from "moment";
import Entry from "./Entry.js";
import "../css/Calendar.css"; // Import the CSS file
import UserDisplay from "../services/UserDisplay.js";

const Calendar = ({ relationshipId }) => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [journalEntries, setJournalEntries] = useState([]);
  const [selectedDateEntries, setSelectedDateEntries] = useState([]);
  const [showMore, setShowMore] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [entryText, setEntryText] = useState("");
  const calendarContainerRef = useRef(null);

  const startOfMonth = currentDate.clone().startOf("month");
  const endOfMonth = currentDate.clone().endOf("month");
  const startDate = startOfMonth.clone().startOf("week");
  const endDate = endOfMonth.clone().endOf("week");

  const days = [];
  let day = startDate.clone();

  while (day <= endDate) {
    days.push(day.clone());
    day.add(1, "day");
  }

  const nextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, "month"));
    setSelectedDate(null);
  };

  const prevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, "month"));
    setSelectedDate(null);
  };

  const selectDate = async (date) => {
    setSelectedDate(date);
    // console.log(date.format("YYYY-MM-DD"));

    try {
      const response = await axios.get(
        `/relationships/${relationshipId}/journalOnDate`,
        {
          params: { date: date },
        }
      );
      setSelectedDateEntries(response.data);
    } catch (error) {
      console.error("Error fetching entries for selected date:", error);
      setSelectedDateEntries([]);
    }
  };

  const fetchMonthEntries = async () => {
    try {
      const response = await axios.get(
        `/relationships/${relationshipId}/journalOnMonth`,
        {
          params: { date: currentDate.format("YYYY-MM") },
        }
      );
      setJournalEntries(response.data);
    } catch (error) {
      console.error("Error fetching entries for month:", error);
      if (error.response) {
        console.error("Error response:", error.response);
      } else if (error.request) {
        console.error("Error request:", error.request);
      } else {
        console.error("General error:", error.message);
      }
    }
  };

  useEffect(() => {
    fetchMonthEntries();
  }, [currentDate, journalEntries, selectedDateEntries]);

  const handleGlobalClick = (event) => {
    if (
      calendarContainerRef.current &&
      !calendarContainerRef.current.contains(event.target)
    ) {
      setSelectedDate(null);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const toggleShowMore = (id) => {
    setShowMore((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateEntry = (updatedEntry) => {
    setJournalEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry._id === updatedEntry._id ? updatedEntry : entry
      )
    );
    setSelectedDateEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry._id === updatedEntry._id ? updatedEntry : entry
      )
    );
  };

  const deleteEntry = (entryId) => {
    setJournalEntries((prevEntries) =>
      prevEntries.filter((entry) => entry._id !== entryId)
    );
    setSelectedDateEntries((prevEntries) =>
      prevEntries.filter((entry) => entry._id !== entryId)
    );
  };

  const handleYearChange = (event) => {
    const year = parseInt(event.target.value, 10);
    setCurrentDate(currentDate.clone().year(year));
  };

  const getYearOptions = () => {
    const currentYear = moment().year();
    const years = [];
    for (let i = currentYear - 50; i <= currentYear + 50; i++) {
      years.push(i);
    }
    return years;
  };

  const today = moment();
  const isCurrentMonth = currentDate.isSame(today, "month");
  const isCurrentDateSelected = selectedDate
    ? selectedDate.isSame(today, "day")
    : false;

  const toggleCreateDialog = () => {
    setShowCreateDialog(!showCreateDialog);
  };

  const handleEntryChange = (event) => {
    setEntryText(event.target.value);
  };

  const handleEntrySubmit = async () => {
    try {
      // You would send a request to your backend here to create the entry
      // For this example, we're just logging the entry text
      console.log("Creating entry with text:", entryText);
      await axios.post(`/relationships/${relationshipId}/createJournal`, {
        entry: entryText,
      });
      // Refresh the entries after submission
      fetchMonthEntries();
      selectDate(selectedDate);
      // Clear entry text and hide dialog after submission
      setEntryText("");
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating journal entry:", error);
    }
  };

  return (
    <div className="calendar-container" ref={calendarContainerRef}>
      <div className="calendar">
        <div className="navigation">
          <button onClick={prevMonth}>&lt;</button>
          <span>{currentDate.format("MMMM")}</span>
          <button onClick={nextMonth}>&gt;</button>
          <select value={currentDate.year()} onChange={handleYearChange}>
            {getYearOptions().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="days">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="day-name">
              {day}
            </div>
          ))}
        </div>
        <div className="dates">
          {days.map((day) => (
            <div
              key={day.format("YYYY-MM-DD")}
              className={`date ${
                day.isSame(currentDate, "month")
                  ? "current-month"
                  : "other-month"
              }`}
              onClick={() => selectDate(day)}
            >
              <a href="#">{day.date()}</a>
            </div>
          ))}
        </div>
      </div>
      <div className="journal-entries">
        <h2>
          {selectedDate
            ? selectedDateEntries.length > 0
              ? `Entries for ${selectedDate.format("MMM DD, YYYY")}`
              : `No entries on ${selectedDate.format("MMM DD, YYYY")}`
            : `Journal Entries for ${currentDate.format("MMMM YYYY")}`}
        </h2>
        {selectedDate ? (
          selectedDateEntries.length > 0 ? (
            selectedDateEntries.map((entry) => (
              <Entry
                key={entry._id}
                entry={entry}
                toggleShowMore={toggleShowMore}
                showMore={showMore}
                relationshipId={relationshipId}
                updateEntry={updateEntry}
                deleteEntry={deleteEntry}
              />
            ))
          ) : (
            <p className="no-entries">No entries on this date.</p>
          )
        ) : journalEntries.length > 0 ? (
          journalEntries.map((entry) => (
            <Entry
              key={entry._id}
              entry={entry}
              toggleShowMore={toggleShowMore}
              showMore={showMore}
              relationshipId={relationshipId}
              updateEntry={updateEntry}
              deleteEntry={deleteEntry}
            />
          ))
        ) : (
          <p className="no-entries">
            No entries to show for {currentDate.format("MMMM YYYY")}
          </p>
        )}
        {(isCurrentDateSelected || isCurrentMonth) && (
          <button className="create-entry-button" onClick={toggleCreateDialog}>
            Create Entry
          </button>
        )}
        {showCreateDialog && (
          <div className="create-entry-dialog active">
            <div className="dialog-body">
              <textarea
                value={entryText}
                onChange={handleEntryChange}
                placeholder="Enter your journal entry..."
                rows={5}
                className="textarea"
              />
            </div>
            <div className="dialog-footer">
              <button className="save-button" onClick={handleEntrySubmit}>
                Submit
              </button>
              <button className="cancel-button" onClick={toggleCreateDialog}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
