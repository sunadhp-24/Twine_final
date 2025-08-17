import Relationship from "../models/Relationship.js";
import User from "../models/User.js";
import Notification from "../models/Notifications.js";
import {
  format,
  startOfDay,
  endOfDay,
  differenceInHours,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";

export const createJournalEntry = async (req, res) => {
  const { id } = req.params;
  const createdBy = req.user.id;
  const { entry } = req.body;
  const getLocalTime = () => {
    const now = new Date();
    return format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  };

  try {
    const relationship = await Relationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    const newJournalEntry = {
      entry,
      createdBy,
      dateOfCreation: getLocalTime(),
    };

    relationship.journalEntries.push(newJournalEntry);
    const user = await User.findById(req.user.id);
    const notifDate = new Date();
    const newNotification1 = new Notification({
      user: relationship.user1,
      message: `${user.name} created a new entry dated ${
        newJournalEntry.dateOfCreation.split("T")[0]
      }. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 3,
      relId: relationship._id,
    });
    const newNotification2 = new Notification({
      user: relationship.user2,
      message: `${user.name} created a new entry dated ${
        newJournalEntry.dateOfCreation.split("T")[0]
      }. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 3,
      relId: relationship._id,
    });
    await newNotification1.save();
    await newNotification2.save();
    await relationship.save();

    res.status(201).json({
      message: "Journal entry created",
      journalEntry: newJournalEntry,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//get journal entries of the given day
export const getJournalEntriesDay = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query; // expecting a date query parameter in YYYY-MM-DD format

  try {
    const relationship = await Relationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    // Parse the date and calculate the start and end of the day
    const startOfDayDate = startOfDay(new Date(date));
    const endOfDayDate = endOfDay(new Date(date));

    // Filter the journal entries by the date range
    const journalEntries = relationship.journalEntries.filter((entry) => {
      const entryDate = new Date(entry.dateOfCreation);
      return entryDate >= startOfDayDate && entryDate <= endOfDayDate;
    });

    res.status(200).json(journalEntries);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getJournalEntriesMonth = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query; // expecting a date query parameter in YYYY-MM format

  try {
    const relationship = await Relationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    // Parse the date and calculate the start and end of the day
    const startOfMonthDate = startOfMonth(new Date(date));
    const endOfMonthDate = endOfMonth(new Date(date));

    // Filter the journal entries by the date range
    const journalEntries = relationship.journalEntries.filter((entry) => {
      const entryDate = new Date(entry.dateOfCreation);
      return entryDate >= startOfMonthDate && entryDate <= endOfMonthDate;
    });

    res.status(200).json(journalEntries);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//update Journal Entry
export const updateJournalEntry = async (req, res) => {
  const { id, entryId } = req.params;
  const userId = req.user.id;
  const { entry } = req.body;

  try {
    const relationship = await Relationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    const journalEntry = relationship.journalEntries.id(entryId);
    if (!journalEntry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    if (journalEntry.createdBy.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You can only edit your own entries" });
    }

    // const entryCreationDate = parseISO(journalEntry.dateOfCreation);
    // console.log(entryCreationDate);
    if (differenceInHours(new Date(), journalEntry.dateOfCreation) > 24) {
      return res.status(400).json({
        message:
          "Unauthorized: You can only edit entries within 24 hours of creation",
      });
    }
    const dateString = journalEntry.dateOfCreation;
    //console.log(dateString.split("T")[0]);
    const user = await User.findById(req.user.id);
    const notifDate = new Date();
    const newNotification1 = new Notification({
      user: relationship.user1,
      message: `${user.name} updated an entry. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 3,
      relId: relationship._id,
    });
    const newNotification2 = new Notification({
      user: relationship.user2,
      message: `${user.name} updated an entry. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 3,
      relId: relationship._id,
    });
    await newNotification1.save();
    await newNotification2.save();

    journalEntry.entry = entry;
    await relationship.save();

    res.status(200).json({ message: "Journal entry updated", journalEntry });
  } catch (error) {
    console.log("Error updating journal entry:", error); // Log the error details
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteJournalEntry = async (req, res) => {
  const { id, entryId } = req.params;
  const userId = req.user.id;

  try {
    const relationship = await Relationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    const journalEntry = relationship.journalEntries.id(entryId);
    if (!journalEntry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    if (journalEntry.createdBy.toString() !== userId) {
      return res.status(403).json({
        message: "Unauthorized: You can only delete your own entries",
      });
    }

    if (differenceInHours(new Date(), journalEntry.dateOfCreation) > 24) {
      return res.status(400).json({
        message:
          "Unauthorized: You can only delete entries within 24 hours of creation",
      });
    }
    //console.log(journalEntry);
    relationship.journalEntries = relationship.journalEntries.filter(
      (entry) => entry.id !== entryId
    );

    const user = await User.findById(req.user.id);
    const notifDate = new Date();
    //console.log(getDate(journalEntry.dateOfCreation));
    const newNotification1 = new Notification({
      user: relationship.user1,
      message: `${user.name} deleted the entry dated ${journalEntry.dateOfCreation}. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 3,
      relId: relationship._id,
    });
    const newNotification2 = new Notification({
      user: relationship.user2,
      message: `${user.name} deleted the entry dated ${journalEntry.dateOfCreation}. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 3,
      relId: relationship._id,
    });
    await newNotification1.save();
    await newNotification2.save();
    await relationship.save();

    res.status(200).json({ message: "Journal entry deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
