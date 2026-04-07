/** @param {number} a @param {number} b @param {number} t [0,1] */
function lerp(a, b, t) {
	return Math.round(a + (b - a) * t);
}

/** Anchor stops: black → dark red → red → purple → primary-like blue */
const SCORE_COLOR_STOPS = [
	{ score: 0, rgb: [6, 6, 8] },
	{ score: 20, rgb: [96, 22, 34] },
	{ score: 50, rgb: [218, 56, 58] },
	{ score: 80, rgb: [118, 58, 172] },
	{ score: 100, rgb: [48, 108, 216] },
];

/**
 * @param {number} n 0–100
 * @returns {[number, number, number]}
 */
function rgbAtScore(n) {
	const stops = SCORE_COLOR_STOPS;
	if (n <= stops[0].score) return [...stops[0].rgb];
	if (n >= stops[stops.length - 1].score) return [...stops[stops.length - 1].rgb];

	for (let i = 0; i < stops.length - 1; i++) {
		const a = stops[i];
		const b = stops[i + 1];
		if (n <= b.score) {
			const t = (n - a.score) / (b.score - a.score);
			return [
				lerp(a.rgb[0], b.rgb[0], t),
				lerp(a.rgb[1], b.rgb[1], t),
				lerp(a.rgb[2], b.rgb[2], t),
			];
		}
	}
	return [...stops[stops.length - 1].rgb];
}

/**
 * Fill color for a 0–100 score bar (piecewise gradient):
 * 0 black → 20 dark red → 50 red → 80 purple → 100 professional blue.
 *
 * @param {number | null | undefined} score
 * @returns {string} CSS color
 */
export function scoreToBarFillColor(score) {
	if (score == null || Number.isNaN(Number(score))) {
		return "rgba(0, 0, 0, 0.35)";
	}
	const n = Math.max(0, Math.min(100, Number(score)));
	const [r, g, b] = rgbAtScore(n);
	return `rgb(${r}, ${g}, ${b})`;
}
