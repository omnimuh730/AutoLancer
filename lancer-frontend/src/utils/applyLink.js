/**
 * Lever job postings often use `.../apply?...` for the apply flow.
 * Opening the parent listing URL (without `/apply`) is preferred for some workflows.
 *
 * @param {string} applyLink
 * @returns {string}
 */
export function normalizeLeverApplyUrl(applyLink) {
	if (!applyLink || typeof applyLink !== "string") return applyLink;
	try {
		const u = new URL(applyLink);
		const host = u.hostname.toLowerCase();
		if (!host.endsWith("lever.co")) return applyLink;

		let path = u.pathname.replace(/\/+$/, "");
		const suffix = "/apply";
		if (!path.endsWith(suffix)) return applyLink;

		path = path.slice(0, -suffix.length) || "/";
		u.pathname = path;
		return u.toString();
	} catch {
		return applyLink;
	}
}
