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
	let skillMatch;
	const requiredSkills = Array.isArray(job?.skills) ? job.skills : [];
	const normalizedUserSkills = Array.isArray(userSkills)
		? userSkills.map(s => String(s).trim().toLowerCase()).filter(Boolean)
		: [];

	// When user skills are available (chip selections), always compute match from them
	// so UI reflects the current personalization state.
	if (normalizedUserSkills.length > 0) {
		const userSkillSet = new Set(normalizedUserSkills);
		const matchedCount = requiredSkills.filter(req => userSkillSet.has(String(req).trim().toLowerCase())).length;
		skillMatch = requiredSkills.length > 0 ? (matchedCount / requiredSkills.length) * 100 : 0;
	} else if (typeof job?.skillScore === 'number' && Number.isFinite(job.skillScore)) {
		// Fallback for contexts where user skills aren't loaded.
		skillMatch = job.skillScore;
	} else {
		skillMatch = 0;
	}

	// Applicants score
	// Use the observed applicant count as-is. Randomizing small counts makes the estimation unstable
	// and produces obviously incorrect results for early postings.
	const applicantCount = job.applicants?.count;
	let applicantScore = 0;
	let estimateApplicantNumber = 0;

	if (typeof applicantCount === 'number' && Number.isFinite(applicantCount) && applicantCount >= 0) {
		// --- Given Data ---
		// Posting time (t = 0) should be when the job was posted, not when we scraped it.
		const startedTime = job.postedAt ? new Date(job.postedAt) : (job._createdAt ? new Date(job._createdAt) : new Date());
		// Applicant count is observed when we scraped/saved the job, not at postedAt.
		const dataPointTime = job._createdAt ? new Date(job._createdAt) : new Date();
		const current = new Date();

		// Guard against inverted timestamps which can produce negative elapsed times.
		// If createdAt is earlier than postedAt, treat postedAt as the earlier one.
		const safeStartedTime = startedTime.getTime() <= dataPointTime.getTime() ? startedTime : dataPointTime;


		// --- Scenario 1: Assume a 48-hour peak interest time ---
		const estimation = estimateApplicants({
			started_time: safeStartedTime,
			passed_time_datapoint: dataPointTime,
			applicants_datapoint: applicantCount,
			current_time: current,
			max_applicants: MAXIMUM_APPLICANTS,
			t0_peak_time_hours: MAXIMUM_BID_DELAY // This is our key assumption
		});

		estimateApplicantNumber = estimation;

		if (estimateApplicantNumber > 200) applicantScore = 0;
		else applicantScore = 100 * Math.pow(Math.cos((estimateApplicantNumber / 200) * (Math.PI / 2)), 1.5);
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
