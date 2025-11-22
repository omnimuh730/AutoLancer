import express from "express";
import { getAccountInfo, addAccountInfo, removeAccountInfo, signup, signin } from "../controllers/accountInfoController.js";

const router = express.Router();

router.get("/account_info", getAccountInfo);
router.post("/account_info", addAccountInfo);
router.delete("/account_info/:name", removeAccountInfo);

// Auth routes
router.post("/auth/signup", signup);
router.post("/auth/signin", signin);

export default router;
