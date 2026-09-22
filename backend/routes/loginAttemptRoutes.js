import express from "express";
import * as loginAttemptController from "../controllers/loginAttemptController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";
import permission from "../middleware/permission.js";

const router = express.Router();

// Restrict all login attempt audit operations to ADMIN role and login_activities permission
router.use(auth, role("ADMIN"), permission("login_activities"));

router.get("/", loginAttemptController.getLoginAttempts);
router.get("/stats", loginAttemptController.getLoginStats);
router.get("/locked", loginAttemptController.getLockedAccounts);
router.delete("/", loginAttemptController.clearLoginAttempts);
router.delete("/:id", loginAttemptController.deleteLoginAttempt);
router.post("/unlock", loginAttemptController.unlockAccount);

export default router;
