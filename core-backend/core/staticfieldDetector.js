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

function checkIfFirstName(parentElement, childElement) {
	const candidateTags = ['firstname', 'first name', 'first-name', 'first_name', 'givenname', 'given-name', 'given_name'];

	//We get meaningfulContext -> this is the description of the field in the html so we can get this by subset of parent.innertext-child.innertext.
	const meaningfulContext = getMeaningfulContext(parentElement, childElement);

	//If meaningfulContext contains any of the candidateTags, we return true
	for (const tag of candidateTags) {
		if (meaningfulContext.includes(tag)) {
			return true;
		}
	}
	return false;
}

function checkIfLastName(parentElement, childElement) {
	const candidateTags = ['lastname', 'last-name', 'last_name', 'last name', 'surname', 'familyname', 'family-name', 'family name'];

	//We get meaningfulContext -> this is the description of the field in the html so we can get this by subset of parent.innertext-child.innertext.
	const meaningfulContext = getMeaningfulContext(parentElement, childElement);

	//If meaningfulContext contains any of the candidateTags, we return true
	for (const tag of candidateTags) {
		if (meaningfulContext.includes(tag)) {
			return true;
		}
	}
	return false;
}

function checkIfName(parentElement, childElement) {
	const candidateTags = ['name', 'fullname', 'full-name', 'full_name'];
	//We get meaningfulContext -> this is the description of the field in the html so we can get this by subset of parent.innertext-child.innertext.
	const meaningfulContext = getMeaningfulContext(parentElement, childElement);

	//If meaningfulContext contains any of the candidateTags, we return true
	for (const tag of candidateTags) {
		if (meaningfulContext.includes(tag)) {
			return true;
		}
	}
	return false;
}

function checkIfEmail(parentElement, childElement) {
	const candidateTags = ['email', 'e-mail', 'email address'];
	//We get meaningfulContext -> this is the description of the field in the html so we can get this by subset of parent.innertext-child.innertext.
	const meaningfulContext = getMeaningfulContext(parentElement, childElement);

	//If meaningfulContext contains any of the candidateTags, we return true
	for (const tag of candidateTags) {
		if (meaningfulContext.includes(tag)) {
			return true;
		}
	}
	return false;
}
function checkIfPhoneNumber(parentElement, childElement) {
	const candidateTags = ['phone', 'telephone', 'phone number', 'mobile', 'contact number', 'cellphone', 'contact'];
	//We get meaningfulContext -> this is the description of the field in the html so we can get this by subset of parent.innertext-child.innertext.
	const meaningfulContext = getMeaningfulContext(parentElement, childElement);

	//If meaningfulContext contains any of the candidateTags, we return true
	for (const tag of candidateTags) {
		if (meaningfulContext.includes(tag)) {
			return true;
		}
	}
	return false;
}
function checkIfLinkedin(parentElement, childElement) {
	const candidateTags = ['linkedin'];
	//We get meaningfulContext -> this is the description of the field in the html so we can get this by subset of parent.innertext-child.innertext.
	const meaningfulContext = getMeaningfulContext(parentElement, childElement);

	//If meaningfulContext contains any of the candidateTags, we return true
	for (const tag of candidateTags) {
		if (meaningfulContext.includes(tag)) {
			return true;
		}
	}
	return false;
}

function checkIfGithub(parentElement, childElement) {
	const candidateTags = ['github'];
	//We get meaningfulContext -> this is the description of the field in the html so we can get this by subset of parent.innertext-child.innertext.
	const meaningfulContext = getMeaningfulContext(parentElement, childElement);

	//If meaningfulContext contains any of the candidateTags, we return true
	for (const tag of candidateTags) {
		if (meaningfulContext.includes(tag)) {
			return true;
		}
	}
	return false;
}
function checkIfPortfolio(parentElement, childElement) {
	const candidateTags = ['portfolio', 'website', 'web site', 'webpage', 'web page'];
	//We get meaningfulContext -> this is the description of the field in the html so we can get this by subset of parent.innertext-child.innertext.
	const meaningfulContext = getMeaningfulContext(parentElement, childElement);

	//If meaningfulContext contains any of the candidateTags, we return true
	for (const tag of candidateTags) {
		if (meaningfulContext.includes(tag)) {
			return true;
		}
	}
	return false;
}

function checkStaticField(parentElement, childElement) {
	/*
	console.log('Question:');
	console.log('-', getMeaningfulContext(parentElement, childElement) || '');
	console.log('Options');
	for (const child of (childElement || [])) {
		console.log('-', child.innerText || '');
	}
		*/
	if (checkIfFirstName(parentElement, childElement)) {
		return {
			findFlag: true,
			fieldType: 'First Name'
		};
	}
	if (checkIfLastName(parentElement, childElement)) {
		return {
			findFlag: true,
			fieldType: 'Last Name'
		};
	}
	if (checkIfName(parentElement, childElement)) {
		return {
			findFlag: true,
			fieldType: 'Full Name'
		};
	}

	return {
		findFlag: false,
		fieldType: null
	}
}

module.exports = { checkStaticField, getMeaningfulContext };