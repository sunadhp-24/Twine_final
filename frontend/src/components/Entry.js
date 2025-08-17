import React, { useState } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import axios from "../services/api.js";
import UserDisplay from "../services/UserDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";

const Entry = ({
  entry,
  toggleShowMore,
  showMore,
  relationshipId,
  onUpdate,
  onDelete,
}) => {
  const { user } = useSelector((state) => state.user);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(entry.entry);
  const isEntryRecent =
    moment().diff(moment(entry.dateOfCreation), "hours") < 24;
  const handleEdit = async () => {
    try {
      const updatedEntry = {
        ...entry,
        entry: editedEntry,
        dateOfCreation: new Date().toISOString(),
      };
      await axios.put(
        `/relationships/${relationshipId}/journalEntries/${entry._id}`,
        updatedEntry
      );
      setIsEditing(false);
      onUpdate(updatedEntry);
    } catch (err) {
      console.log(err);
      //   if (err.reponse.status === 400) {
      //     setError("Can't edit after 24 hours.");
      //   } else if (err.response.status === 403) {
      //     setError("Unauthorized!");
      //   } else {
      //     setError("Unexpected error, please try again.");
      //   }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Do you want to delete this entry?")) {
      try {
        await axios.delete(
          `/relationships/${relationshipId}/journalEntries/${entry._id}`
        );
        onDelete(entry._id);
      } catch (err) {
        console.log(err);
        // if (err.reponse.status === 400) {
        //   setError("Can't edit after 24 hours.");
        // } else if (err.response.status === 403) {
        //   setError("Unauthorized!");
        // } else {
        //   setError("Unexpected error, please try again.");
        // }
      }
    }
  };

  return (
    <div className="journal-entry">
      <p className="entry-date">
        {moment(entry.dateOfCreation).format("MMM DD, YYYY [at] HH:mm")}
      </p>
      <p className="entry-text">
        {isEditing ? (
          <textarea
            value={editedEntry}
            onChange={(e) => setEditedEntry(e.target.value)}
            rows="4"
            cols="50"
          />
        ) : entry.entry.length > 100 ? (
          <>
            {showMore[entry._id]
              ? entry.entry
              : `${entry.entry.substring(0, 100)}...`}
            <span
              className="show-more"
              onClick={() => toggleShowMore(entry._id)}
            >
              {showMore[entry._id] ? "Show less" : "Show more"}
            </span>
          </>
        ) : (
          <>
            <span>{entry.entry}</span>
          </>
        )}
      </p>
      <p className="entry-user">
        {entry.createdBy && <UserDisplay userId={entry.createdBy} />}
      </p>
      <div className="entry-actions">
        {isEditing ? (
          <>
            <button onClick={handleEdit}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </>
        ) : user._id == entry.createdBy && isEntryRecent ? (
          <div>
            <FontAwesomeIcon
              icon={faPen}
              onClick={() => setIsEditing(true)}
              className="faPen"
            />
            <FontAwesomeIcon
              icon={faTrash}
              onClick={handleDelete}
              className="faTrash"
            />
          </div>
        ) : null}
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Entry;
