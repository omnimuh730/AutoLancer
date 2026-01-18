// core/getFunctionCalling.js

const decisionSchema = {
	// Identity
	'firstname': 'Bryan',
	'lastname': 'Reyes',
	'name': 'Bryan Reyes',
	'email': 'bryanreyes@example.com',
	'phonenumber': '+1 123 456 7890',
	'location': 'Salt Lake City, Utah',

	// Links
	'linkedin': 'https://linkedin.com/in/bryanreyes',
	'github': 'https://github.com/bryanreyes',
	'portfolio': 'https://bryanreyes.com',

	// Files
	'resume': 'C:\\Users\\Bryan\\Documents\\Resume.pdf',

	// Demographics & Legal (Exact text matching usually required for buttons)
	'work_authorization': 'Yes',
	'sponsorship_required': 'No', // <--- This answers your specific case
	'salary_expectation': '160000',
	'coverletter': 'This is the cover letter'
};

function getProfileValue(fieldKey) {
	return decisionSchema[fieldKey] || null;
}

module.exports = { getProfileValue };