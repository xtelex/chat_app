import express from "express";
import {
  searchUsers,
  addContact,
  getContacts,
  removeContact,
  setContactNickname,
  createContactRequest,
  respondToContactRequest,
  listContactRequests
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Search for users by email or name
router.get("/search", requireAuth, searchUsers);

// Get user's added contacts
router.get("/contacts", requireAuth, getContacts);

// Add a contact (preferred)
router.post("/contacts", requireAuth, addContact);

// Remove a contact (preferred)
router.delete("/contacts", requireAuth, removeContact);

// Set nickname for a contact
router.patch("/contacts/nickname", requireAuth, setContactNickname);

// Contact requests (add + accept/decline)
router.get("/contact-requests", requireAuth, listContactRequests);
router.post("/contact-requests", requireAuth, createContactRequest);
router.patch("/contact-requests", requireAuth, respondToContactRequest);

// Backwards-compatible routes
router.post("/contacts/add", requireAuth, addContact);
router.delete("/contacts/remove", requireAuth, removeContact);

export default router;
