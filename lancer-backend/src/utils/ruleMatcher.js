import { rulesCollection } from '../db/mongo.js';

function evaluateRule(job, rule) {
	const { field, operator, value } = rule;
	let jobValue;

	if (field === 'companyName') {
		jobValue = job.company?.name;
	} else if (field === 'title') {
		jobValue = job.title;
	}

	if (jobValue === undefined || jobValue === null) {
		return false;
	}

	const jobValueStr = String(jobValue).toLowerCase();
	const ruleValueStr = String(value).toLowerCase();

	switch (operator) {
		case 'equals':
			return jobValueStr === ruleValueStr;
		case 'contains':
			return jobValueStr.includes(ruleValueStr);
		case 'pattern':
			try {
				const regex = new RegExp(value, 'i'); // 'i' for case-insensitive
				return regex.test(jobValue);
			} catch (e) {
				console.error(`Invalid regex pattern in rule: ${value}`, e);
				return false;
			}
		default:
			return false;
	}
}

function evaluateRuleSet(job, ruleSet) {
	const { rules, logicalOperators } = ruleSet;
	if (!rules || rules.length === 0) {
		return false;
	}

	let result = evaluateRule(job, rules[0]);

	for (let i = 0; i < logicalOperators.length; i++) {
		const logicalOp = logicalOperators[i];
		const nextRuleResult = evaluateRule(job, rules[i + 1]);

		switch (logicalOp) {
			case 'AND':
				result = result && nextRuleResult;
				break;
			case 'OR':
				result = result || nextRuleResult;
				break;
			case 'XOR':
				result = result !== nextRuleResult;
				break;
			case 'NOR':
				result = !(result || nextRuleResult);
				break;
		}
	}

	return result;
}

export async function isJobBlocked(job) {
	try {
		const allRules = await rulesCollection.find({}).toArray();
		if (allRules.length === 0) {
			return null; // No rules to check against
		}

		for (const ruleSet of allRules) {
			if (evaluateRuleSet(job, ruleSet)) {
				return ruleSet.name; // Return the name of the rule that blocked the job
			}
		}

		return null; // Job is not blocked by any rule
	} catch (error) {
		console.error('Error checking job against rules:', error);
		return null; // Fail open, don't block if there's an error
	}
}

export function buildMongoQueryForRule(ruleSet) {
    const { rules, logicalOperators } = ruleSet;
    if (!rules || rules.length === 0) {
        return {};
    }

    const mongoOperatorMap = {
        AND: '$and',
        OR: '$or',
        XOR: '$xor', // Note: MongoDB doesn't have a direct $xor query operator for general queries. This will be tricky.
        NOR: '$nor',
    };

    // Helper to create a single condition
    const createCondition = (rule) => {
        const { field, operator, value } = rule;
        const fieldName = field === 'companyName' ? 'company.name' : 'title';
        
        switch (operator) {
            case 'equals':
                return { [fieldName]: { $regex: `^${value}$`, $options: 'i' } };
            case 'contains':
                return { [fieldName]: { $regex: value, $options: 'i' } };
            case 'pattern':
                return { [fieldName]: { $regex: value, $options: 'i' } };
            default:
                return {};
        }
    };

    // For a single rule, the query is simple
    if (rules.length === 1) {
        return createCondition(rules[0]);
    }

    // Handling complex logical operators is more involved.
    // A simple approach for AND/OR/NOR is to group them.
    // MongoDB's query structure is nested, e.g., { $or: [ { condition1 }, { condition2 } ] }
    // A mix of operators like A AND B OR C is ambiguous without parentheses.
    // The current UI implies sequential evaluation: (A op B) op C.
    // MongoDB queries don't work like that. They take an array of conditions for $and, $or, $nor.
    //
    // Let's assume for now that all logical operators in a rule set are the SAME.
    // e.g., A AND B AND C, or A OR B OR C. This is a reasonable simplification.
    const firstOperator = logicalOperators[0];
    const allOperatorsAreTheSame = logicalOperators.every(op => op === firstOperator);

    if (allOperatorsAreTheSame && mongoOperatorMap[firstOperator]) {
        const operator = mongoOperatorMap[firstOperator];
        if (operator === '$xor') {
             // XOR is not supported like this. We can't build a simple query.
             // We'd have to fetch and filter in memory, which defeats the purpose of a DB query.
             // For now, we will not support search for XOR rules.
             return { _id: null }; // Return a query that finds nothing
        }
        const conditions = rules.map(createCondition);
        return { [operator]: conditions };
    }

    // If operators are mixed, we cannot reliably build a mongo query.
    // For now, we will return a query that finds nothing if the rule is too complex.
    // A proper implementation would require a parser to build an Abstract Syntax Tree.
    console.warn(`Cannot build mongo query for rule set with mixed logical operators: ${ruleSet.name}`);
    return { _id: null }; // Return a query that finds nothing
}
