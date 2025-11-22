
import express from "express";
import {
	getSkills,
	addSkill,
	deleteSkill,
	updateSkills
} from "../controllers/personalInfoController.js";

const router = express.Router();

router.get('/personal/skills', getSkills);
router.post('/personal/skills', addSkill);
router.delete('/personal/skills', deleteSkill);
router.post('/personal/skills/update', updateSkills);

export default router;
