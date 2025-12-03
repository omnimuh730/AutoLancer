const cheerio = require('cheerio');

function analyzeData(data) {
	// Placeholder for analysis logic
	//	console.log('Analyzing data:', data);
	const innerHTML_Children = data.Children;
	const innerHTML_Parent = data.Parent;
	/*
		if (innerHTML_Children.length > 1) {
			console.log('Multiple children> ', 'tag:', data.Parent.tag, data.Parent.properties);
			for (const child of innerHTML_Children) {
				console.log(' - Child tag:', child.tag, 'properties:', child.properties);
			}
		} else {
			console.log('Single children ', 'tag: ', data.Parent.tag, data.Parent.properties);
			console.log(' - Child tag:', innerHTML_Children[0].tag, 'properties:', innerHTML_Children[0].properties);
		}
	*/

	// Return some dummy analysis result

	//Submit Button
	//Extract innertext from innerHTML_Children using cheerio

	// Assume innerHTML_Children is available and Cheerio is imported.

	const targetWords = ['submit', 'apply', 'register', 'sign up', 'sign me up', 'create account', 'get started', 'join now', 'next', 'continue', 'signin', 'signup', 'sign in', 'log in'];

	// Create the regex pattern: (word1|word2|...) with case-insensitivity ('i')
	const regex = new RegExp(targetWords.join('|'), 'i');

	for (const child of innerHTML_Children) {
		let textToMatch = '';

		if (child.tag === 'button' || child.tag === 'a') {
			// Use innerText for standard tags
			textToMatch = child.innerText;

		} else if (child.tag === 'input') {
			// Use properties.value for input tags
			textToMatch = child.properties.value;
		}

		// Ensure textToMatch is a string and trim whitespace
		const normalizedText = (textToMatch || '').toLowerCase().trim();

		// Check if the normalized text contains any of the target words using search()
		if (normalizedText.search(regex) !== -1) {
			// SUCCESS: The value "submit application" will match because it contains "submit"
			console.log('Found Target Button Text/Value:', textToMatch);
			console.log('Component', child);
			console.log('Tag', child.tag);
			console.log('Properties', child.properties);
		}
	}


	return {
		summary: 'This is a summary of the analyzed data.',
		insights: []
	};
}

module.exports = { analyzeData };