
import { personalInfoCollection } from "../db/mongo.js";

export async function getSkills(req, res) {
	try {
		if (!personalInfoCollection) return res.status(503).json({ success: false, error: 'Database not ready' });
		const docs = await personalInfoCollection.find({}).toArray();
		const skills = docs.map(d => d.name);
		return res.json({ success: true, skills });
	} catch (err) {
		console.error('GET /api/personal/skills error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export async function addSkill(req, res) {
	try {
		if (!personalInfoCollection) return res.status(503).json({ success: false, error: 'Database not ready' });
		const { skill } = req.body;
		if (!skill || typeof skill !== 'string') return res.status(400).json({ success: false, error: 'Missing skill string in body' });
		const name = skill.trim();
		if (!name) return res.status(400).json({ success: false, error: 'Empty skill' });
		await personalInfoCollection.updateOne({ name }, { $setOnInsert: { name, createdAt: new Date().toISOString() } }, { upsert: true });
		const docs = await personalInfoCollection.find({}).toArray();
		return res.json({ success: true, skills: docs.map(d => d.name) });
	} catch (err) {
		console.error('POST /api/personal/skills error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export async function deleteSkill(req, res) {
	try {
		if (!personalInfoCollection) return res.status(503).json({ success: false, error: 'Database not ready' });
		const { skill } = req.body;
		if (!skill || typeof skill !== 'string') return res.status(400).json({ success: false, error: 'Missing skill string in body' });
		const name = skill.trim();
		if (!name) return res.status(400).json({ success: false, error: 'Empty skill' });
		await personalInfoCollection.deleteOne({ name });
		const docs = await personalInfoCollection.find({}).toArray();
		return res.json({ success: true, skills: docs.map(d => d.name) });
	} catch (err) {
		console.error('DELETE /api/personal/skills error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}

export async function updateSkills(req, res) {
	try {
		if (!personalInfoCollection) return res.status(503).json({ success: false, error: 'Database not ready' });
		const { skills } = req.body;
		if (!Array.isArray(skills)) return res.status(400).json({ success: false, error: 'Missing skills array in body' });
		await personalInfoCollection.deleteMany({});
		if (skills.length) {
			await personalInfoCollection.insertMany(skills.map(name => ({ name, createdAt: new Date().toISOString() })));
		}
		const docs = await personalInfoCollection.find({}).toArray();
		return res.json({ success: true, skills: docs.map(d => d.name) });
	} catch (err) {
		console.error('POST /api/personal/skills/update error', err);
		return res.status(500).json({ success: false, error: err.message });
	}
}
