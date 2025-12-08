import {
	jobsCollection,
	skillsCategoryCollection
} from "../db/mongo.js";

const normalizeSkill = (skill) => {
	if (!skill || typeof skill !== 'string') return '';
	return skill.trim();
};

const uniqueNormalizedSkills = (skills = []) => {
	return [...new Set(skills.map(normalizeSkill).filter(Boolean))];
};

export async function computeSkillScoreValue(skills = []) {
	if (!skillsCategoryCollection || !Array.isArray(skills) || !skills.length) {
		return 0;
	}
	const normalizedSkills = uniqueNormalizedSkills(skills);
	if (!normalizedSkills.length) return 0;

	const matchedCount = await skillsCategoryCollection.countDocuments({ name: { $in: normalizedSkills } });
	return Math.round((matchedCount / normalizedSkills.length) * 100);
}

export async function getMissingSkills(skills = []) {
	if (!skillsCategoryCollection || !Array.isArray(skills) || !skills.length) {
		return [];
	}
	const normalizedSkills = uniqueNormalizedSkills(skills);
	if (!normalizedSkills.length) return [];

	const existing = await skillsCategoryCollection.find({ name: { $in: normalizedSkills } }).project({ name: 1 }).toArray();
	const existingSet = new Set(existing.map(doc => doc.name));
	return normalizedSkills.filter(skill => !existingSet.has(skill));
}

export async function refreshSkillScoresForSkills(skills = []) {
	if (!jobsCollection || !skillsCategoryCollection || !skills.length) return;
	const normalizedTargets = uniqueNormalizedSkills(skills);
	if (!normalizedTargets.length) return;

	const cursor = jobsCollection.find({ skills: { $in: normalizedTargets } }, { projection: { _id: 1, skills: 1 } });
	for await (const job of cursor) {
		const score = await computeSkillScoreValue(job.skills || []);
		await jobsCollection.updateOne(
			{ _id: job._id },
			{
				$set: {
					skillScore: score,
					modelVersion: '1.12.8'
				}
			}
		);
	}
}

export { uniqueNormalizedSkills };
