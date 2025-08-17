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
import Notification2 from "../models/Notifications2.js";

export const createRelationship = async (req, res, next) => {
  const { user2Username, tag } = req.body;
  const user1 = req.user.id;

  try {
    const user2 = await User.findOne({ name: user2Username }); // Make sure the field name matches your User schema
    if (!user2) return res.status(404).json({ message: "User not found" });

    // Check if the relationship already exists
    const existingRelationship = await Relationship.findOne({
      $or: [
        { user1: user1, user2: user2._id },
        { user1: user2._id, user2: user1 },
      ],
    });

    if (existingRelationship) {
      return res.status(400).json({ message: "Relationship already exists" });
    }

    const newNotification = new Notification2({
      userId: user1,
      recipentId: user2.id,
      tag: tag,
      status: "pending",
    });
    newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    next(error);
  }
};

// Get all relationships of a user
export const getAllRelationships = async (req, res, next) => {
  const tag = req.query?.tag;
  const userId = req.user.id;
  //console.log(req.user);
  try {
    const filter = {
      $or: [{ user1: userId }, { user2: userId }],
      ...(tag && { tag }),
    };
    const relationships = await Relationship.find(filter);
    return res.status(201).json(relationships);
  } catch (error) {
    next(error);
  }
};

// Get a specific relationship
export const getRelationship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const relationship = await Relationship.findById(id);
    return res.status(201).json({ relationship });
  } catch (error) {
    next(error);
  }
};

export const UpdateRelationship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const relationship = await Relationship.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    const user1 = await User.findById(relationship.user1);
    const user2 = await User.findById(relationship.user2);
    const notifDate = new Date();
    const newNotification1 = new Notification({
      user:
        relationship.user1 === req.user.id
          ? relationship.user1
          : relationship.user2,
      message: `You changed the relationship with ${
        relationship.user1 === req.user.id ? user2.name : user1.name
      } to ${relationship.tag}. Tap to see!`,
      timeStamp: notifDate,
      read: false,
      type: 1,
      relId: relationship._id,
    });
    const newNotification2 = new Notification({
      user:
        relationship.user1 === req.user.id
          ? relationship.user2
          : relationship.user1,
      message: `${
        relationship.user1 === req.user.id ? user1.name : user2.name
      } changed the relationship with you to ${relationship.tag}. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 1,
      relId: relationship._id,
    });
    await newNotification1.save();
    await newNotification2.save();
    return res.status(201).json({ relationship });
  } catch (error) {
    next(error);
  }
};

export const DeleteRelationship = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Assuming Relationship.findById(id) to find the relationship by id
    const relationship = await Relationship.findById(id);
    //console.log(relationship);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    // Ensure that the current user has permission to delete this relationship
    if (
      relationship.user1.toString() !== req.user.id &&
      relationship.user2.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Find user details
    const user1 = await User.findById(relationship.user1);
    const user2 = await User.findById(relationship.user2);

    // Create notifications
    const notifDate = new Date();
    const newNotification1 = new Notification({
      user:
        relationship.user1 === req.user.id
          ? relationship.user1
          : relationship.user2,
      message: `You removed relationship with ${
        relationship.user1 === req.user.id ? user2.name : user1.name
      }. Tap to see!`,
      timeStamp: notifDate,
      read: false,
      type: 1,
      relId: relationship._id,
    });

    const newNotification2 = new Notification({
      user:
        relationship.user1 === req.user.id
          ? relationship.user2
          : relationship.user1,
      message: `${
        relationship.user1 === req.user.id ? user1.name : user2.name
      } removed relationship with you. Tap to see!`,
      timeStamp: notifDate,
      read: false,
      type: 1,
      relId: relationship._id,
    });

    // Save notifications
    await newNotification1.save();
    await newNotification2.save();

    // Delete relationship
    await Relationship.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ message: "Relationship deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// export const createJournalEntry = async (req, res) => {
//   const { id } = req.params;
//   const createdBy = req.user.id;
//   const { entry } = req.body;
//   const getLocalTime = () => {
//     const now = new Date();
//     return format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
//   };

//   try {
//     const relationship = await Relationship.findById(id);
//     if (!relationship) {
//       return res.status(404).json({ message: "Relationship not found" });
//     }

//     const newJournalEntry = {
//       entry,
//       createdBy,
//       dateOfCreation: getLocalTime(),
//     };

//     relationship.journalEntries.push(newJournalEntry);
//     await relationship.save();

//     res.status(201).json({
//       message: "Journal entry created",
//       journalEntry: newJournalEntry,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// //get journal entries of the given day
// export const getJournalEntriesDay = async (req, res) => {
//   const { id } = req.params;
//   const { date } = req.query; // expecting a date query parameter in YYYY-MM-DD format

//   try {
//     const relationship = await Relationship.findById(id);
//     if (!relationship) {
//       return res.status(404).json({ message: "Relationship not found" });
//     }

//     // Parse the date and calculate the start and end of the day
//     const startOfDayDate = startOfDay(new Date(date));
//     const endOfDayDate = endOfDay(new Date(date));

//     // Filter the journal entries by the date range
//     const journalEntries = relationship.journalEntries.filter((entry) => {
//       const entryDate = new Date(entry.dateOfCreation);
//       return entryDate >= startOfDayDate && entryDate <= endOfDayDate;
//     });

//     res.status(200).json(journalEntries);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// export const getJournalEntriesMonth = async (req, res) => {
//   const { id } = req.params;
//   const { date } = req.query; // expecting a date query parameter in YYYY-MM format

//   try {
//     const relationship = await Relationship.findById(id);
//     if (!relationship) {
//       return res.status(404).json({ message: "Relationship not found" });
//     }

//     // Parse the date and calculate the start and end of the day
//     const startOfMonthDate = startOfMonth(new Date(date));
//     const endOfMonthDate = endOfMonth(new Date(date));

//     // Filter the journal entries by the date range
//     const journalEntries = relationship.journalEntries.filter((entry) => {
//       const entryDate = new Date(entry.dateOfCreation);
//       return entryDate >= startOfMonthDate && entryDate <= endOfMonthDate;
//     });

//     res.status(200).json(journalEntries);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// //update Journal Entry
// export const updateJournalEntry = async (req, res) => {
//   const { id, entryId } = req.params;
//   const userId = req.user.id;
//   const { entry } = req.body;

//   try {
//     const relationship = await Relationship.findById(id);
//     if (!relationship) {
//       return res.status(404).json({ message: "Relationship not found" });
//     }

//     const journalEntry = relationship.journalEntries.id(entryId);
//     if (!journalEntry) {
//       return res.status(404).json({ message: "Journal entry not found" });
//     }

//     if (journalEntry.createdBy.toString() !== userId) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized: You can only edit your own entries" });
//     }

//     // const entryCreationDate = parseISO(journalEntry.dateOfCreation);
//     // console.log(entryCreationDate);
//     if (differenceInHours(new Date(), journalEntry.dateOfCreation) > 24) {
//       return res.status(400).json({
//         message:
//           "Unauthorized: You can only edit entries within 24 hours of creation",
//       });
//     }

//     journalEntry.entry = entry;
//     await relationship.save();

//     res.status(200).json({ message: "Journal entry updated", journalEntry });
//   } catch (error) {
//     console.log("Error updating journal entry:", error); // Log the error details
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// export const deleteJournalEntry = async (req, res) => {
//   const { id, entryId } = req.params;
//   const userId = req.user.id;

//   try {
//     const relationship = await Relationship.findById(id);
//     if (!relationship) {
//       return res.status(404).json({ message: "Relationship not found" });
//     }

//     const journalEntry = relationship.journalEntries.id(entryId);
//     if (!journalEntry) {
//       return res.status(404).json({ message: "Journal entry not found" });
//     }

//     if (journalEntry.createdBy.toString() !== userId) {
//       return res.status(403).json({
//         message: "Unauthorized: You can only delete your own entries",
//       });
//     }

//     if (differenceInHours(new Date(), journalEntry.dateOfCreation) > 24) {
//       return res.status(400).json({
//         message:
//           "Unauthorized: You can only delete entries within 24 hours of creation",
//       });
//     }
//     //console.log(journalEntry);
//     relationship.journalEntries = relationship.journalEntries.filter(
//       (entry) => entry.id !== entryId
//     );
//     await relationship.save();

//     res.status(200).json({ message: "Journal entry deleted" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// export const createImportantEvent = async (req, res) => {
//   const { id } = req.params;
//   const createdBy = req.user.id;
//   const { event, dateOfEvent, category } = req.body;
//   console.log(req.body);
//   const date = new Date(dateOfEvent);

//   try {
//     const relationship = await Relationship.findById(id);
//     if (!relationship) {
//       return res.status(404).json({ message: "Relationship not found" });
//     }

//     const newEvent = {
//       event,
//       date,
//       createdBy,
//       category,
//     };
//     const user = await User.findById(req.user.id);
//     const newNotification = new Notification({
//       user1: relationship.user1,
//       user2: relationship.user2,
//       message: `${user.name} created a new event. Tap  to see!`,
//       timeStamp: new Date(),
//       read: false,
//     });

//     relationship.importantEvents.push(newEvent);
//     await relationship.save();
//     await newNotification.save();

//     res.status(201).json({
//       message: "New event recorded",
//       event: newEvent,
//       notification: newNotification,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// export const getAllEvents = async (req, res, next) => {
//   const { id } = req.params;
//   const { dayFilter, typeFilter } = req.query;

//   try {
//     const relationship = await Relationship.findById(id);
//     if (!relationship) {
//       return res.status(404).json({ message: "Relationship not found" });
//     }
//     let filteredEvents = relationship.importantEvents;
//     if (typeFilter) {
//       filteredEvents = filteredEvents.filter((event) => {
//         return event.category === typeFilter;
//       });
//     }
//     if (dayFilter) {
//       if (dayFilter === "today") {
//         filteredEvents = filteredEvents.filter((event) => {
//           const today = new Date();
//           return (
//             event.date >= startOfDay(today) && event.date <= endOfDay(today)
//           );
//         });
//       }
//       if (dayFilter === "week") {
//         filteredEvents = filteredEvents.filter((event) => {
//           const today = new Date();
//           return (
//             event.date >= startOfWeek(today) && event.date <= endOfWeek(today)
//           );
//         });
//       }
//       if (dayFilter === "month") {
//         filteredEvents = filteredEvents.filter((event) => {
//           const today = new Date();
//           //console.log(startOfMonth(today));
//           return (
//             event.date >= startOfMonth(today) && event.date <= endOfMonth(today)
//           );
//         });
//       }
//     }

//     res.status(200).json(filteredEvents);
//   } catch (error) {
//     next(error);
//   }
// };

// export const updateEvent = async (req, res, next) => {
//   const { id, eventId } = req.params;
//   const userId = req.user.id;
//   const { event, dateOfEvent, category } = req.body;
//   let date = new Date();
//   if (dateOfEvent) {
//     date = new Date(dateOfEvent);
//   }

//   try {
//     //console.log(startOfMonth(date));
//     const relationship = await Relationship.findById(id);
//     if (!relationship) {
//       return res.status(404).json({ message: "Relationship not found" });
//     }

//     const savedEvent = relationship.importantEvents.id(eventId);
//     if (!savedEvent) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     if (savedEvent.createdBy.toString() !== userId) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized: You can only edit your events" });
//     }

//     // const entryCreationDate = parseISO(journalEntry.dateOfCreation);
//     // console.log(entryCreationDate);
//     if (new Date() > savedEvent.date) {
//       return res.status(400).json({
//         message: "Unauthorized: You cannot edit after the event has passed",
//       });
//     }
//     if (event) {
//       savedEvent.event = event;
//     }
//     if (dateOfEvent) {
//       savedEvent.date = date;
//     }
//     if (category) {
//       savedEvent.category = category;
//     }
//     await relationship.save();

//     res.status(200).json({ message: "Event updated", savedEvent });
//   } catch (error) {
//     next(error);
//   }
// };

// export const deleteEvent = async (req, res, next) => {
//   const { id, eventId } = req.params;
//   const userId = req.user.id;

//   try {
//     const relationship = await Relationship.findById(id);
//     if (!relationship) {
//       return res.status(404).json({ message: "Relationship not found" });
//     }

//     const event = relationship.importantEvents.id(eventId);
//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     if (event.createdBy.toString() !== userId) {
//       return res.status(403).json({
//         message: "Unauthorized: You can only delete your events",
//       });
//     }
//     relationship.importantEvents = relationship.importantEvents.filter(
//       (event) => event.id !== eventId
//     );
//     await relationship.save();

//     res.status(200).json({ message: "Event deleted", event });
//   } catch (error) {
//     next(error);
//   }
// };
