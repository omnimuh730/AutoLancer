// utils/jobScore.js
// Calculates job match scores for UI

const MAXIMUM_APPLICANTS = 200;
const MAXIMUM_BID_DELAY = 48.0;

function estimateApplicants({
	started_time,
	passed_time_datapoint,
	applicants_datapoint,
	current_time,
	max_applicants = MAXIMUM_APPLICANTS,
	t0_peak_time_hours = MAXIMUM_BID_DELAY
}) {
	// --- Step 1: Calculate Elapsed Times in Hours ---

	// Validate the known data point to prevent mathematical errors (e.g., log of a negative number)
	if (applicants_datapoint < 0 || applicants_datapoint > max_applicants) {
		console.log("applicants_datapoint must be a positive number and less than max_applicants.");
		return 0;
	}

	// Date subtraction in JS gives milliseconds. Convert to hours.
	const MS_PER_HOUR = 1000 * 60 * 60;
	const t_known = (passed_time_datapoint.getTime() - started_time.getTime()) / MS_PER_HOUR;
	const t_current = (current_time.getTime() - started_time.getTime()) / MS_PER_HOUR;

	// Edge case: Avoid division by zero if our data point happens to be exactly at the peak time.
	if (t_known === t0_peak_time_hours) {
		console.log("Cannot calculate growth rate 'k' because the data point is at the assumed peak time (t_known equals t0). Please choose a different t0 or provide a different data point.");
		return 0;
	}


	// --- Step 2: Calibrate the Curve - Solve for Growth Rate 'k' ---
	// The formula is: k = ln( (L / N) - 1 ) / (t₀ - t)
	// Math.log() in JavaScript is the natural logarithm (ln).
	const numerator = Math.log((max_applicants / applicants_datapoint) - 1);
	const denominator = t0_peak_time_hours - t_known;
	const k = numerator / denominator;


	// --- Step 3: Make the Estimation ---
	// The formula is: f(t) = L / (1 + e^(-k * (t - t₀)))
	// Math.exp(x) in JavaScript is e^x.
	const exponent = -k * (t_current - t0_peak_time_hours);
	const estimatedCount = max_applicants / (1 + Math.exp(exponent));

	return estimatedCount;
}

// --- HELPER FUNCTIONS FOR CALCULATIONS (UNCHANGED and CORRECT) ---
const parseAndCalculateMidYearlySalary = (salaryStr) => {
	if (!salaryStr || typeof salaryStr !== 'string') return null;
	const isHourly = salaryStr.includes('/hr');
	const numbers = salaryStr.match(/[\d.]+/g);
	if (!numbers) return null;
	let values = numbers.map(parseFloat);
	if (salaryStr.toLowerCase().includes('k')) values = values.map(v => v * 1000);
	if (isHourly) values = values.map(v => v * 40 * 52);
	return values.length > 1 ? (values[0] + values[1]) / 2 : values[0];
};
const calculateSalaryScore = (jobMidSalary) => {
	if (jobMidSalary > 140000) return 100;
	const x = jobMidSalary / 100000;
	const score = (-(((x - 1.4) / 0.55) ** 4) + 1) ** 2;
	return score > 1 ? 0 : Math.round(score * 100);
};

export function calculateJobScores(job, userSkills) {
	// Skill match
	const requiredSkills = job.skills || [];
	const userSkillSet = new Set((userSkills || []).map(s => s.toLowerCase()));
	const matchedCount = requiredSkills.filter(req => userSkillSet.has(req.toLowerCase())).length;
	const skillMatch = requiredSkills.length > 0 ? (matchedCount / requiredSkills.length) * 100 : 0;

	// Applicants score
	const applicantCount = job.applicants?.count <= 25 ? Math.floor(Math.random() * 15 + 10) : job.applicants?.count;
	let applicantScore = 0;
	let estimateApplicantNumber = 0;

	if (typeof applicantCount === 'number') {
		// --- Given Data ---
		const start = job._createdAt ? new Date(job._createdAt) : new Date(); // Job posting start time
		const data_point_time = job.postedAt ? new Date(job.postedAt) : new Date(start.getTime() + 1);
		const data_point_applicants = applicantCount;
		//get current time;
		const current = new Date();


		// --- Scenario 1: Assume a 48-hour peak interest time ---
		const estimation = estimateApplicants({
			started_time: start,
			passed_time_datapoint: data_point_time,
			applicants_datapoint: data_point_applicants,
			current_time: current,
			max_applicants: MAXIMUM_APPLICANTS,
			t0_peak_time_hours: MAXIMUM_BID_DELAY // This is our key assumption
		});

		estimateApplicantNumber = estimation;
		applicantScore = estimation > MAXIMUM_APPLICANTS ? 0 : (MAXIMUM_APPLICANTS - estimation) / 20;
		if (applicantCount <= 25) applicantScore = 100;
		else if (applicantCount >= MAXIMUM_APPLICANTS) applicantScore = 0;
		else applicantScore = 100 - (((applicantCount - 25) / (MAXIMUM_APPLICANTS - 25)) * 100);
	}

	// Freshness score
	let postedDateScore = 0;
	if (job.postedAt) {
		const limit_date = 3;
		const hoursAgo = (Date.now() - new Date(job.postedAt).getTime()) / 3600000;
		const daysAgo = hoursAgo / 24;
		const weeksAgo = daysAgo / limit_date;
		if (weeksAgo > limit_date)
			postedDateScore = 0;
		else {
			const fx = Math.floor(((1 - ((weeksAgo * 2) ** 4) / 16) ** 8) * 100);

			postedDateScore = fx > 100 ? 0 : fx < 0 ? 0 : fx;
		}
	}

	// Salary score
	const midSalary = parseAndCalculateMidYearlySalary(job.details?.money);
	const salaryScore = calculateSalaryScore(midSalary);

	// Overall score
	const WEIGHT_SKILL = 3;
	const WEIGHT_APPLICANTS = 2;
	const WEIGHT_FRESHNESS = 2;
	const WEIGHT_SALARY = 1;

	let overallScore = 0;
	if (salaryScore === null) {
		const totalWeight = WEIGHT_SKILL + WEIGHT_APPLICANTS + WEIGHT_FRESHNESS;
		overallScore = (
			(skillMatch * WEIGHT_SKILL) +
			(applicantScore * WEIGHT_APPLICANTS) +
			(postedDateScore * WEIGHT_FRESHNESS)
		) / totalWeight;
	} else {
		const totalWeight = WEIGHT_SKILL + WEIGHT_APPLICANTS + WEIGHT_FRESHNESS + WEIGHT_SALARY;
		overallScore = (
			(skillMatch * WEIGHT_SKILL) +
			(applicantScore * WEIGHT_APPLICANTS) +
			(postedDateScore * WEIGHT_FRESHNESS) +
			(salaryScore * WEIGHT_SALARY)
		) / totalWeight;
	}

	return {
		skillMatch: Math.round(skillMatch),
		applicantScore: Math.round(applicantScore),
		postedDateScore: Math.round(postedDateScore),
		salaryScore: salaryScore !== null ? Math.round(salaryScore) : null,
		overallScore: Math.round(overallScore),
		estimateApplicantNumber: Math.round(estimateApplicantNumber)
	};
}
