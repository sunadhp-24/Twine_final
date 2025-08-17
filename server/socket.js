import { differenceInHours } from "date-fns";
import Relationship from "./models/Relationship.js";
import Message from "./models/Message.js";
import Notification from "./models/Notifications.js";
import User from "./models/User.js";
import { verifySocketToken } from "./middleware/socketAuth.js";

export default function initializeSocket(io) {
  // Secure connections with middleware
  io.use(verifySocketToken);

  io.on("connection", (socket) => {
    console.log(`✅ User Connected: ${socket.id}`);
    const senderId = socket.user.id;

    socket.on("joinRoom", async (relationshipId) => {
      try {
        const relationship = await Relationship.findById(relationshipId);
        if (
          relationship &&
          (relationship.user1.toString() === senderId ||
            relationship.user2.toString() === senderId)
        ) {
          socket.join(relationshipId);
          console.log(
            `User ${socket.id} joined authorized room ${relationshipId}`
          );
        } else {
          console.warn(
            `SECURITY: User ${senderId} failed to join unauthorized room ${relationshipId}.`
          );
        }
      } catch (error) {
        console.error(
          `Error during joinRoom event for user ${senderId}:`,
          error
        );
      }
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { relationshipId, content } = data;
        const relationship = await Relationship.findById(relationshipId);
        if (
          !relationship ||
          (relationship.user1.toString() !== senderId &&
            relationship.user2.toString() !== senderId)
        ) {
          return;
        }
        const newMessage = new Message({
          relationshipId,
          sender: senderId,
          content,
        });
        await newMessage.save();
        const populatedMessage = await newMessage.populate(
          "sender",
          "name avatar"
        );
        io.to(relationshipId).emit("receiveMessage", populatedMessage);

        // Create Notification
        const recipientId =
          relationship.user1.toString() === senderId
            ? relationship.user2
            : relationship.user1;
        const sender = await User.findById(senderId);
        const notification = new Notification({
          user: recipientId,
          message: `New message from ${sender.name}.`,
          read: false,
          timeStamp: new Date(),
          type: 5,
          relId: relationshipId,
        });
        await notification.save();
      } catch (error) {
        console.error(
          `Error during sendMessage event for user ${senderId}:`,
          error
        );
      }
    });

    socket.on("editMessage", async (data) => {
      try {
        const { messageId, newContent } = data;
        const message = await Message.findById(messageId);
        if (
          message &&
          message.sender.toString() === senderId &&
          !message.deleted
        ) {
          if (differenceInHours(new Date(), message.createdAt) > 1) {
            return socket.emit("actionError", {
              message: "Edit time limit (1 hour) has passed.",
            });
          }
          message.content = newContent;
          message.edited = true;
          await message.save();
          const populatedMessage = await Message.findById(messageId).populate(
            "sender",
            "name avatar"
          );
          io.to(message.relationshipId.toString()).emit(
            "messageUpdated",
            populatedMessage
          );
        }
      } catch (error) {
        console.error(
          `Error during editMessage event for user ${senderId}:`,
          error
        );
      }
    });

    socket.on("deleteMessage", async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findById(messageId);
        if (
          message &&
          message.sender.toString() === senderId &&
          !message.deleted
        ) {
          if (differenceInHours(new Date(), message.createdAt) > 1) {
            return socket.emit("actionError", {
              message: "Delete time limit (1 hour) has passed.",
            });
          }
          message.content = "This message was deleted";
          message.deleted = true;
          await message.save();
          const populatedMessage = await Message.findById(messageId).populate(
            "sender",
            "name avatar"
          );
          io.to(message.relationshipId.toString()).emit(
            "messageUpdated",
            populatedMessage
          );
        }
      } catch (error) {
        console.error(
          `Error during deleteMessage event for user ${senderId}:`,
          error
        );
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ User Disconnected: ${socket.id}`);
    });
  });
}
