const { getFunctionCalling } = require("./getFunctionCalling");

function getMeaningfulContext(parentElement, childElement) {
	const parentText = parentElement.innerText || '';
	const childSequence = (childElement || []).map(child => child.innerText || '').join('');

	let context = parentText;

	if (childSequence) {
		const lastIndex = parentText.lastIndexOf(childSequence);

		if (lastIndex !== -1) {
			// Remove the last instance of the concatenated sequence
			context = parentText.slice(0, lastIndex) + parentText.slice(lastIndex + childSequence.length);
		}
	}

	const meaningfulContext = context.toLowerCase();
	return meaningfulContext;
};

const staticFieldDetectionRule = [
	{
		'field': 'firstname',
		'tags': ['firstname', 'first name', 'first-name', 'first_name', 'givenname', 'given-name', 'given_name']
	},
	{
		'field': 'lastname',
		'tags': ['lastname', 'last-name', 'last_name', 'last name', 'surname', 'familyname', 'family-name', 'family name']
	},
	{
		'field': 'name',
		'tags': ['name', 'fullname', 'full-name', 'full_name']
	},
	{
		'field': 'email',
		'tags': ['email', 'e-mail', 'email address']
	},
	{
		'field': 'phonenumber',
		'tags': ['phone', 'phonenumber', 'phone-number', 'phone_number', 'telephone', 'mobile', 'contact number']
	},
	{
		'field': 'linkedin',
		'tags': ['linkedin', 'linked in']
	},
	{
		'field': 'github',
		'tags': ['github', 'git hub']
	},
	{
		'field': 'portfolio',
		'tags': ['portfolio']
	}
]
function checkIfPredefinedStaticField(parentElement, childElement) {
	//We get meaningfulContext -> this is the description of the field in the html so we can get this by subset of parent.innertext-child.innertext.
	const meaningfulContext = getMeaningfulContext(parentElement, childElement);

	//If meaningfulContext contains any of the candidateTags, we return true
	for (const candidateField of staticFieldDetectionRule) {
		for (const tag of candidateField.tags) {
			if (meaningfulContext.includes(tag)) {
				console.log(meaningfulContext, 'matches with tag:', tag);
				return {
					result: true,
					field: candidateField.field
				};
			}
		}
	}
	return {
		result: false,
		field: null
	};
}

function checkStaticField(parentElement, childElement) {
	let schema_StaticFieldReasoning = {
		'question': getMeaningfulContext(parentElement, childElement),
		'options': (childElement || []).map(child => ({
			'tag': child.tag || '',
			'text': child.innerText || '',
			'textlength': (child.innerText || '').length
		})),
		decision: 'none',
		reasoning: 'none',
		functionCalling: null,
		isThisMandatory: true,
		actionComponent: childElement
	};
	const predefinedFieldCheck = checkIfPredefinedStaticField(parentElement, childElement);
	if (predefinedFieldCheck.result === true) {
		schema_StaticFieldReasoning.decision = predefinedFieldCheck.field;
		const fieldValue = getFunctionCalling(schema_StaticFieldReasoning.decision);
		schema_StaticFieldReasoning.functionCalling = fieldValue;
		if (fieldValue) {
			schema_StaticFieldReasoning.action_suggestion = {
				command: "TYPING",
				payload: {
					value: fieldValue,
					timeout_ms: 100 // Default timeout
				}
			};
		}
		console.log(schema_StaticFieldReasoning);

		return schema_StaticFieldReasoning;
	}
	/*
	This is the exception cases
	*/
	console.log('----------');
	console.log('Question:', getMeaningfulContext(parentElement, childElement));
	console.log('Options:');
	for (const child of (childElement || [])) {
		console.log('Tag:', child.tag || '', 'Text:', child.innerText || '');
	}
	console.log('Child Component:', childElement);
	console.log('----------|--------------------|--------------------|--------------------');

	return schema_StaticFieldReasoning;
}

module.exports = { checkStaticField, getMeaningfulContext };