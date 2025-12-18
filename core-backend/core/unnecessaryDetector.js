function checkIfThisElementIsUnnecessary(element) {
	if (element.tag === 'a')
		return true;
	return false;
}

module.exports = { checkIfThisElementIsUnnecessary };