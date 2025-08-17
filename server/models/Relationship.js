import mongoose from "mongoose";

const dailyQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: String,
  createdBy: {
    type: String,
    required: true,
  },
});

const importantEventSchema = new mongoose.Schema({
  event: { type: String, required: true },
  date: { type: Date, default: Date.now() },
  createdBy: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["birthday", "anniversary", "sports", "work", "study", "other"],
    required: true,
    default: "other",
  },
});

const journalSchema = new mongoose.Schema({
  entry: { type: String, required: true, maxlength: 200 },
  dateOfCreation: { type: Date, default: Date.now },
  createdBy: {
    type: String,
    required: true,
  },
});

const relationshipSchema = new mongoose.Schema({
  user1: { type: String, required: true },
  user2: { type: String, required: true },
  tag: {
    type: String,
    enum: ["friend", "family", "lover", "colleague", "other"],
    required: true,
  },
  dailyQuestions: [dailyQuestionSchema],
  importantEvents: [importantEventSchema],
  journalEntries: [journalSchema],
});

const Relationship = mongoose.model("Relationship", relationshipSchema);
export default Relationship;
