const decisionSchema = {
	'firstname': 'John',
	'lastname': 'Doe',
	'name': 'John Doe',
	'email': 'johndoe@example.com'
}

function getFunctionCalling(decision) {
	return decisionSchema[decision] || null;
}

module.exports = { getFunctionCalling };