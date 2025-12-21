function checkIfThisElementIsUnnecessary(parentElement, childElement) {

	let isAll_a_tags = false;
	if (childElement) {
		isAll_a_tags = true;
		for (const child of childElement) {
			if (child.tag !== 'a') {
				isAll_a_tags = false;
			}
		}
	}
	/*
		if (isAll_a_tags === true) {
			console.log('-------Unnecessary Elements---');
			console.log('Options:');
			for (const child of (childElement || [])) {
				console.log('Tag:', child.tag || '', 'Text:', child.innerText || '');
			}
	
			console.log('----------|--------------------|--------------------|--------------------');
		}
			*/
	return isAll_a_tags;
}

module.exports = { checkIfThisElementIsUnnecessary };