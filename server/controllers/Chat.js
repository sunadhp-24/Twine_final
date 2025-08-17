import Message from "../models/Message.js";
import Relationship from "../models/Relationship.js";
import { differenceInHours } from "date-fns"; // Import date-fns function

// sendMessage and getMessages functions remain the same...

export const sendMessage = async (req, res, next) => {
  const { relationshipId, content } = req.body;
  const senderId = req.user.id;

  if (!content || !content.trim()) {
    return res
      .status(400)
      .json({ message: "Message content cannot be empty." });
  }

  try {
    const relationship = await Relationship.findById(relationshipId);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found." });
    }
    if (
      relationship.user1.toString() !== senderId &&
      relationship.user2.toString() !== senderId
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: You are not a member of this chat." });
    }

    const newMessage = new Message({
      relationshipId,
      sender: senderId,
      content,
    });

    await newMessage.save();
    const populatedMessage = await newMessage.populate("sender", "name avatar");

    res.status(201).json(populatedMessage);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  const { relationshipId } = req.params;
  const userId = req.user.id;

  try {
    const relationship = await Relationship.findById(relationshipId);
    if (!relationship) {
      return res.status(404).json({ message: "Relationship not found." });
    }
    if (
      relationship.user1.toString() !== userId &&
      relationship.user2.toString() !== userId
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You cannot view these messages." });
    }

    const messages = await Message.find({ relationshipId })
      .populate("sender", "name avatar")
      .sort({ createdAt: "asc" });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// --- UPDATED FUNCTIONS ---

export const updateMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }
    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only edit your own messages." });
    }
    // --- TIME LIMIT CHECK ---
    if (differenceInHours(new Date(), message.createdAt) > 1) {
      return res.status(400).json({
        message: "You can only edit messages within 1 hour of sending.",
      });
    }

    message.content = content;
    message.edited = true; // Mark message as edited
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }
    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own messages." });
    }
    // --- TIME LIMIT CHECK ---
    if (differenceInHours(new Date(), message.createdAt) > 1) {
      return res.status(400).json({
        message: "You can only delete messages within 1 hour of sending.",
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully." });
  } catch (error) {
    next(error);
  }
};
