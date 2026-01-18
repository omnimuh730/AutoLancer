// core/profileLoader.js
const fs = require('fs');
const path = require('path');

let cachedProfile = null;

function getFullUserProfile() {
	if (cachedProfile) return cachedProfile;

	try {
		// Adjust path to match your project structure
		const profilePath = path.resolve(__dirname, '..', '..', 'mcp-server', 'src', 'data', 'profile.json');

		// Fallback for testing if file doesn't exist
		if (!fs.existsSync(profilePath)) {
			console.warn("Profile file not found, using mock data.");
			return {
				name: "Bryan Reyes",
				resumeText: "Experienced Senior Full-Stack Engineer with 8 years of experience in React, Node.js, and AWS. Proven track record in health-tech...",
				skills: ["JavaScript", "React", "Node.js", "Python"],
				bio: "I am a passionate engineer who loves solving complex problems."
			};
		}

		const content = fs.readFileSync(profilePath, 'utf8');
		cachedProfile = JSON.parse(content);
		return cachedProfile;
	} catch (e) {
		console.error("Error loading profile:", e);
		return {};
	}
}

module.exports = { getFullUserProfile };