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

export const createImportantEvent = async (req, res, next) => {
  const { id } = req.params;
  const createdBy = req.user.id;
  const { event, dateOfEvent, category } = req.body;
  //console.log(req.body);
  const date = new Date(dateOfEvent);

  try {
    const relationship = await Relationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    const newEvent = {
      event,
      date,
      createdBy,
      category,
    };
    const user = await User.findById(req.user.id);
    const notifDate = new Date();
    const newNotification1 = new Notification({
      user: relationship.user1,
      message: `${user.name} created a new event. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 2,
      relId: relationship._id,
    });
    const newNotification2 = new Notification({
      user: relationship.user2,
      message: `${user.name} created a new event. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 2,
      relId: relationship._id,
    });

    relationship.importantEvents.push(newEvent);
    await relationship.save();
    await newNotification1.save();
    await newNotification2.save();

    res.status(201).json({
      message: "New event recorded",
      event: newEvent,
      notifications: { newNotification1, newNotification2 },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllEvents = async (req, res, next) => {
  const { id } = req.params;
  const { dayFilter, typeFilter } = req.query;

  try {
    const relationship = await Relationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }
    let filteredEvents = relationship.importantEvents;
    if (typeFilter) {
      filteredEvents = filteredEvents.filter((event) => {
        return event.category === typeFilter;
      });
    }
    if (dayFilter) {
      if (dayFilter === "today") {
        filteredEvents = filteredEvents.filter((event) => {
          const today = new Date();
          return (
            event.date >= startOfDay(today) && event.date <= endOfDay(today)
          );
        });
      }
      if (dayFilter === "week") {
        filteredEvents = filteredEvents.filter((event) => {
          const today = new Date();
          return (
            event.date >= startOfWeek(today) && event.date <= endOfWeek(today)
          );
        });
      }
      if (dayFilter === "month") {
        filteredEvents = filteredEvents.filter((event) => {
          const today = new Date();
          //console.log(startOfMonth(today));
          return (
            event.date >= startOfMonth(today) && event.date <= endOfMonth(today)
          );
        });
      }
    }

    res.status(200).json(filteredEvents);
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  const { id, eventId } = req.params;
  const userId = req.user.id;
  const { event, dateOfEvent, category } = req.body;
  let date = new Date();
  if (dateOfEvent) {
    date = new Date(dateOfEvent);
  }

  try {
    //console.log(startOfMonth(date));
    const relationship = await Relationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    const savedEvent = relationship.importantEvents.id(eventId);
    if (!savedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (savedEvent.createdBy.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You can only edit your events" });
    }

    // const entryCreationDate = parseISO(journalEntry.dateOfCreation);
    // console.log(entryCreationDate);
    if (new Date() > savedEvent.date) {
      return res.status(400).json({
        message: "Unauthorized: You cannot edit after the event has passed",
      });
    }
    if (event) {
      savedEvent.event = event;
    }
    if (dateOfEvent) {
      savedEvent.date = date;
    }
    if (category) {
      savedEvent.category = category;
    }
    const user = await User.findById(req.user.id);
    const notifDate = new Date();
    const newNotification1 = new Notification({
      user: relationship.user1,
      message: `${user.name} updated an event. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 2,
      relId: relationship._id,
    });
    const newNotification2 = new Notification({
      user: relationship.user2,
      message: `${user.name} updated an event. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 2,
      relId: relationship._id,
    });
    await newNotification1.save();
    await newNotification2.save();
    await relationship.save();

    res.status(200).json({ message: "Event updated", savedEvent });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  const { id, eventId } = req.params;
  const userId = req.user.id;

  try {
    const relationship = await Relationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    const event = relationship.importantEvents.id(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.createdBy.toString() !== userId) {
      return res.status(403).json({
        message: "Unauthorized: You can only delete your events",
      });
    }
    relationship.importantEvents = relationship.importantEvents.filter(
      (event) => event.id !== eventId
    );
    const user = await User.findById(req.user.id);
    const notifDate = new Date();
    const newNotification1 = new Notification({
      user: relationship.user1,
      message: `${user.name} deleted an event. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 2,
      relId: relationship._id,
    });
    const newNotification2 = new Notification({
      user: relationship.user2,
      message: `${user.name} deleted an event. Tap  to see!`,
      timeStamp: notifDate,
      read: false,
      type: 2,
      relId: relationship._id,
    });
    await newNotification1.save();
    await newNotification2.save();
    await relationship.save();

    res.status(200).json({ message: "Event deleted", event });
  } catch (error) {
    next(error);
  }
};
