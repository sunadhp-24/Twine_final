import mongoose from "mongoose";

const notificationsSchema = new mongoose.Schema({
  user: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  timeStamp: { type: Date, required: true },
  type: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
  relId: { type: String },
});

const Notification = mongoose.model("Notification", notificationsSchema);
export default Notification;
