const cheerio = require('cheerio');
const { matchesSubmitKeyword } = require('./submitDetector');
const { checkIfThisElementIsUnnecessary } = require('./unnecessaryDetector');
const { checkStaticField } = require('./staticfieldDetector');

function analyzeData(data) {
	// Placeholder for analysis logic
	//	console.log('Analyzing data:', data);
	const innerHTML_Children = data.Children;
	const innerHtml_Parent = data.Parent;

	// Check if current item - children item is Submit Application button

	if (innerHTML_Children.length == 1) {
		if (matchesSubmitKeyword(innerHTML_Children[0])) {
			console.log('Submit Application button detected in component:');
			return {
				summary: 'Submit Application button detected.',
				insights: data
			}
		}
	}

	// Check if current item is unnecessary link like Terms of Privacy, Cookie Policy, etc.
	let flagUnnecessary = false;
	for (const childElement of innerHTML_Children) {
		if (checkIfThisElementIsUnnecessary(childElement)) {
			flagUnnecessary = true;
			break;
		}
	}

	if (flagUnnecessary) {
		console.log('Unnecessary element detected in component:');
		return {
			summary: 'Unnecessary element detected.',
			insights: data
		}
	}

	const CheckFieldResult = checkStaticField(innerHtml_Parent, innerHTML_Children);
	if (CheckFieldResult.findFlag === true) {
		return {
			summary: 'StaticField is detected',
			reasoning: CheckFieldResult.fieldType,
			insights: data
		}
	}

	return {
		summary: 'This is a summary of the analyzed data.',
		insights: []
	};
}

module.exports = { analyzeData };