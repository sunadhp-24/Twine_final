import express from "express";
import { sendMessage, getMessages } from "../controllers/Chat.js";
import { verifyJwtToken } from "../middleware/Verify.js";

const router = express.Router();

// Route to send a message
router.post("/send", verifyJwtToken, sendMessage);

// Route to get all messages for a specific relationship
router.get("/:relationshipId", verifyJwtToken, getMessages);

export default router;
