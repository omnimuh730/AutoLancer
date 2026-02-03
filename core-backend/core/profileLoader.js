// core/profileLoader.js
const fs = require('fs');
const path = require('path');

const PROFILE_PATH = path.resolve(__dirname, '..', '..', 'mcp-server', 'src', 'data', 'profile.json');

let cached = null;

function loadProfilesData() {
	try {
		const stat = fs.statSync(PROFILE_PATH);
		if (cached && cached.mtimeMs === stat.mtimeMs) return cached.data;

		const content = fs.readFileSync(PROFILE_PATH, 'utf8');
		const parsed = JSON.parse(content);
		cached = { mtimeMs: stat.mtimeMs, data: parsed };
		return parsed;
	} catch (e) {
		console.error('Error loading profiles:', e);
		return { profiles: [] };
	}
}

function listProfiles() {
	const data = loadProfilesData();
	const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
	return profiles.map((p) => {
		const identifier = p?.identifier || '';
		const name = p?.personal?.name || identifier || 'Unknown';
		const location = p?.personal?.location || '';
		const title = p?.preference?.desiredJobTitle || '';
		return {
			identifier,
			label: [name, title, location].filter(Boolean).join(' — ') || identifier
		};
	}).filter((p) => p.identifier);
}

function getProfileByIdentifier(profileIdentifier) {
	const data = loadProfilesData();
	const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
	if (!profiles.length) return null;
	if (!profileIdentifier) return profiles[0];

	const needle = String(profileIdentifier).toLowerCase();
	return profiles.find((p) => String(p?.identifier || '').toLowerCase() === needle) || profiles[0];
}

function getRawProfilesFile() {
	return loadProfilesData();
}

function formatProfileForPrompt(profile) {
	if (!profile || typeof profile !== 'object') return '';

	const name = profile?.personal?.name || profile?.identifier || '';
	const location = profile?.personal?.location || '';
	const address = profile?.personal?.address || '';
	const phone = profile?.contact?.phone || '';
	const email = profile?.contact?.email || '';
	const linkedin = profile?.contact?.linkedin || '';
	const github = profile?.contact?.github || '';

	const degree = profile?.education?.degree || '';
	const university = profile?.education?.university || '';

	const desiredTitle = profile?.preference?.desiredJobTitle || '';
	const desiredLocation = profile?.preference?.desiredLocation || '';
	const ableToRelocate = profile?.preference?.ableToRelocate || '';
	const desiredSalary = profile?.preference?.desiredSalary || '';

	const workAuthorization = profile?.work?.workAuthorization || '';
	const eeoRace = profile?.eeo?.race || '';
	const eeoGender = profile?.eeo?.gender || '';
	const eeoVeteran = profile?.eeo?.veteranStatus || '';
	const eeoDisability = profile?.eeo?.disabilityStatus || '';

	const career = Array.isArray(profile?.career) ? profile.career : [];
	const careerLines = career
		.map((c) => {
			const title = c?.title || '';
			const company = c?.company || '';
			const start = c?.startDate || '';
			const end = c?.endDate || '';
			return [title, company, start && end ? `| ${start} - ${end}` : ''].filter(Boolean).join(' ');
		})
		.filter(Boolean);

	return `
**Candidate Profile**
	- **Name:** ${name}
	- **Location:** ${location}
	- **Address:** ${address}
	- **Email:** ${email}
	- **Phone:** ${phone}
	- **LinkedIn:** ${linkedin}
	- **GitHub:** ${github}
	- **Education:** ${[degree, university].filter(Boolean).join(' at ')}
	- **Work Authorization:** ${workAuthorization}
	- **Preferences:** ${[desiredTitle && `Role: ${desiredTitle}`, desiredLocation && `Location: ${desiredLocation}`, ableToRelocate && `Relocate: ${ableToRelocate}`, desiredSalary && `Salary: ${desiredSalary}`].filter(Boolean).join(' | ')}
	- **EEO:** ${[eeoGender && `Gender: ${eeoGender}`, eeoRace && `Race: ${eeoRace}`, eeoVeteran && `Veteran: ${eeoVeteran}`, eeoDisability && `Disability: ${eeoDisability}`].filter(Boolean).join(' | ')}
	- **Career:**
${careerLines.map((l) => `\t\t- ${l}`).join('\n')}
`;
}

module.exports = {
	loadProfilesData,
	listProfiles,
	getProfileByIdentifier,
	getRawProfilesFile,
	formatProfileForPrompt,
	PROFILE_PATH
};
