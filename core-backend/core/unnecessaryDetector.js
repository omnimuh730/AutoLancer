const { getMeaningfulContext } = require('./staticfieldDetector');

function checkIfThisElementIsUnnecessary(parentElement, childElement) {
	/*
		console.log('Question:');
		console.log('-', getMeaningfulContext(parentElement, childElement) || '');
		console.log('Options');
		for (const child of (childElement || [])) {
			console.log('Tag:', child.tag || '', 'Text:', child.innerText || '');
		}
		*/

	if (childElement && childElement[0].tag === 'a')
		return true;
	return false;
}

module.exports = { checkIfThisElementIsUnnecessary };