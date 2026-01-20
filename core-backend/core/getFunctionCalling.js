// core/getFunctionCalling.js

const { getProfileByIdentifier } = require('./profileLoader');

function splitName(fullName) {
	const value = (fullName || '').trim();
	if (!value) return { first: '', last: '' };
	const parts = value.split(/\s+/).filter(Boolean);
	if (parts.length === 1) return { first: parts[0], last: '' };
	return { first: parts[0], last: parts.slice(1).join(' ') };
}

function getProfileValue(fieldKey, options = {}) {
	const profile = getProfileByIdentifier(options.profileIdentifier);
	if (!profile) return null;

	const fullName = profile?.personal?.name || profile?.identifier || '';
	const { first, last } = splitName(fullName);

	switch (fieldKey) {
		// Identity
		case 'firstname': return first || null;
		case 'lastname': return last || null;
		case 'name': return fullName || null;
		case 'email': return profile?.contact?.email || null;
		case 'phonenumber': return profile?.contact?.phone || null;
		case 'location': return profile?.personal?.location || null;

		// Links
		case 'linkedin': return profile?.contact?.linkedin || null;
		case 'github': return profile?.contact?.github || null;
		case 'portfolio': return profile?.contact?.portfolio || profile?.contact?.website || null;
		case 'website': return profile?.contact?.website || profile?.contact?.portfolio || null;
		case 'twitter': return profile?.contact?.twitter || null;

		// Files (optional; add to profile.json when available)
		case 'resume': return profile?.files?.resumePath || profile?.resumePath || null;
		case 'coverletter': return profile?.files?.coverLetterPath || profile?.coverLetterPath || null;
		case 'fileupload': return profile?.files?.fileUploadPath || null;

		// Work / preferences
		case 'work_authorization': return profile?.work?.workAuthorization || null;
		case 'sponsorship_required': {
			const explicit = profile?.work?.sponsorshipRequired ?? profile?.preference?.sponsorshipRequired;
			if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
			if (typeof explicit === 'boolean') return explicit ? 'Yes' : 'No';

			const auth = String(profile?.work?.workAuthorization || '').toLowerCase();
			// Best-effort inference: most candidates with "authorized to work" do not require sponsorship.
			if (auth.includes('authorized')) return 'No';
			return null;
		}
		case 'salary_expectation': return profile?.preference?.desiredSalary || null;

		// EEO style fields (often used in selection questions)
		case 'gender': return profile?.eeo?.gender || profile?.eeo?.Gender || null;
		case 'race': return profile?.eeo?.race || null;
		case 'veteran_status': return profile?.eeo?.veteranStatus || null;
		case 'disability_status': return profile?.eeo?.disabilityStatus || null;

		default:
			return null;
	}
}

module.exports = { getProfileValue };
