import mongoose from "mongoose";

const notificationsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  recipentId: { type: String, required: true },
  tag: {
    type: String,
    enum: ["friend", "family", "lover", "colleague", "other"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accept", "decline"],
    default: "pending",
  },
});

const Notification2 = mongoose.model("Notification2", notificationsSchema);
export default Notification2;
