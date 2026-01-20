const { getProfileValue } = require("./getFunctionCalling");

function getMeaningfulContext(parentElement, childElement) {
	// 1. Start with the visible parent label text
	let context = (parentElement.innerText || '').toLowerCase();

	// Remove "Required" asterisks or common UI noise
	context = context.replace(/\*/g, '').trim();

	// 2. SCRAPE CHILD ATTRIBUTES
	// This is the fix. We look at the children to see if they contain 
	// hints like 'placeholder="Add a cover letter"' or 'name="cover_letter"'
	if (childElement && Array.isArray(childElement)) {
		const attributeHints = childElement.map(child => {
			const p = child.properties || {};
			// Collect all helpful attributes
			return [
				p.placeholder,
				p.name,
				p.id,
				p['aria-label'],
				p.title
			].filter(val => typeof val === 'string' && val.length > 0).join(' ');
		}).join(' ');

		// Append these hints to the context
		context += ' ' + attributeHints.toLowerCase();
	}

	// Clean up newlines to make matching easier
	context = context.replace(/\n/g, ' ');

	return context;
};

const staticFieldDetectionRule = [
	{ field: 'firstname', tags: ['first name', 'given name', 'fname'] },
	{ field: 'lastname', tags: ['last name', 'family name', 'surname', 'lname'] },
	{ field: 'name', tags: ['full name', 'name', 'your name'] },
	{ field: 'email', tags: ['email'] },
	{ field: 'phonenumber', tags: ['phone', 'mobile', 'telephone', 'cell'] },
	{ field: 'linkedin', tags: ['linkedin'] },
	{ field: 'github', tags: ['github'] },
	{ field: 'portfolio', tags: ['portfolio', 'website', 'personal site'] },
	{ field: 'website', tags: ['website', 'personal site', 'webpage'] },
	{ field: 'twitter', tags: ['twitter'] },
	{ field: 'location', tags: ['location', 'city', 'address', 'residence'] },

	// Updated Tags for Resume/Cover Letter to catch "Additional Info" context
	{ field: 'resume', tags: ['resume', 'cv', 'curriculum vitae'] },
	{ field: 'coverletter', tags: ['cover letter', 'coverletter'] }, // matches "add a cover letter..."

	{ field: 'work_authorization', tags: ['legally authorized', 'work in the', 'eligibility', 'visa sponsorship', 'authorized to work'] },
	{ field: 'sponsorship_required', tags: ['require sponsorship', 'need sponsorship', 'h-1b', 'visa sponsorship', 'sponsorship'] },
	{ field: 'salary_expectation', tags: ['salary', 'compensation', 'pay', 'expected'] },
	{ field: 'file_upload', tags: ['upload', 'attach'] }
];

function identifyFieldIntent(context) {
	for (const rule of staticFieldDetectionRule) {
		if (rule.tags.some(tag => context.includes(tag))) {
			return { isStatic: true, field: rule.field };
		}
	}
	return { isStatic: false, field: null };
}

module.exports = { identifyFieldIntent, getMeaningfulContext };
