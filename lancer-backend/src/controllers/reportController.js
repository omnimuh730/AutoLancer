import { jobsCollection, accountInfoCollection } from "../db/mongo.js";
import { JobSource } from '../../../configs/pub.js'; // <-- Import JobSource list

export async function getDailyApplications(req, res) {
	try {
		if (!jobsCollection) {
			return res.status(503).json({ success: false, error: "Database not ready" });
		}

		// Optional applier filter
		let applierId = null;
		if (req.query?.applierName && accountInfoCollection) {
			const applier = await accountInfoCollection.findOne({ name: req.query.applierName });
			applierId = applier?._id || null;
		}

		const dailyApplications = await jobsCollection.aggregate([
			{
				$unwind: "$status"
			},
			{
				$match: Object.assign(
					{ "status.appliedDate": { $exists: true } },
					applierId ? { "status.applier": applierId } : {}
				)
			},
			{
				$project: {
					date: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$status.appliedDate" } } }
				}
			},
			{
				$group: {
					_id: "$date",
					value: { $sum: 1 }
				}
			},
			{
				$project: {
					_id: 0,
					date: "$_id",
					value: 1
				}
			},
			{
				$sort: {
					date: 1
				}
			}
		]).toArray();

		res.json({ success: true, data: dailyApplications });
	} catch (err) {
		console.error('GET /api/reports/daily-applications error', err);
		res.status(500).json({ success: false, error: err.message });
	}
}

export async function getJobSources(req, res) {
	try {
		if (!jobsCollection) {
			return res.status(503).json({ success: false, error: "Database not ready" });
		}

		// Dynamically build the branches for the $switch operator from the pub.js config
		const sourceBranches = JobSource.map(source => ({
			case: { $regexMatch: { input: "$applyLink", regex: source, options: "i" } },
			then: source
		}));

		const jobSources = await jobsCollection.aggregate([
			// Stage 1: Add a new field 'derivedSource' to each document.
			// Use $switch to categorize based on the 'applyLink' URL.
			{
				$addFields: {
					derivedSource: {
						$switch: {
							branches: sourceBranches,
							default: "Other" // If no known source matches, categorize as 'Other'
						}
					}
				}
			},
			// Stage 2: Group by the new 'derivedSource' field and count the documents in each group.
			{
				$group: {
					_id: "$derivedSource",
					value: { $sum: 1 }
				}
			},
			// Stage 3: Reshape the output to match the format expected by the frontend.
			{
				$project: {
					_id: 0,
					source: "$_id",
					value: 1
				}
			}
		]).toArray();

		// The frontend already handles filling in sources with 0 counts,
		// so we don't need to add that logic here. We only return sources that exist in the DB.

		res.json({ success: true, data: jobSources });
	} catch (err) {
		console.error('GET /api/reports/job-sources error', err);
		res.status(500).json({ success: false, error: err.message });
	}
}

export async function getJobSourceSummary(req, res) {
	try {
		if (!jobsCollection) {
			return res.status(503).json({ success: false, error: "Database not ready" });
		}

		// Optional applier filter
		let applierId = null;
		if (req.query?.applierName && accountInfoCollection) {
			const applier = await accountInfoCollection.findOne({ name: req.query.applierName });
			applierId = applier?._id || null;
		}
		const sourceBranches = JobSource.map(source => ({
			case: { $regexMatch: { input: "$applyLink", regex: source, options: "i" } },
			then: source
		}));

		const jobSourceSummary = await jobsCollection.aggregate([
			{
				$addFields: {
					derivedSource: {
						$switch: {
							branches: sourceBranches,
							default: "Other"
						}
					}
				}
			},
			{
				$facet: {
					postings: [
						{ $group: { _id: "$derivedSource", count: { $sum: 1 } } }
					],
					applied: [
						{ $unwind: { path: "$status", preserveNullAndEmptyArrays: false } },
						{ $match: { $and: [
							{ "status.appliedDate": { $exists: true } },
							{ $or: [ { "status.scheduledDate": { $exists: false } }, { "status.scheduledDate": null } ] },
							{ $or: [ { "status.declinedDate": { $exists: false } }, { "status.declinedDate": null } ] },
							...(applierId ? [ { "status.applier": applierId } ] : [])
						] } },
						{ $group: { _id: "$derivedSource", count: { $sum: 1 } } }
					],
					scheduled: [
						{ $unwind: { path: "$status", preserveNullAndEmptyArrays: false } },
						{ $match: Object.assign({ "status.scheduledDate": { $exists: true } }, applierId ? { "status.applier": applierId } : {}) },
						{ $group: { _id: "$derivedSource", count: { $sum: 1 } } }
					],
					declined: [
						{ $unwind: { path: "$status", preserveNullAndEmptyArrays: false } },
						{ $match: Object.assign({ "status.declinedDate": { $exists: true } }, applierId ? { "status.applier": applierId } : {}) },
						{ $group: { _id: "$derivedSource", count: { $sum: 1 } } }
					]
				}
			},
			// Combine facet outputs into a single array of documents per source
			{
				$project: {
					allSources: {
						$setUnion: [
							{ $map: { input: "$postings", as: "p", in: "$$p._id" } },
							{ $map: { input: "$applied", as: "a", in: "$$a._id" } },
							{ $map: { input: "$scheduled", as: "s", in: "$$s._id" } },
							{ $map: { input: "$declined", as: "d", in: "$$d._id" } }
						]
					},
					postings: 1,
					applied: 1,
					scheduled: 1,
					declined: 1
				}
			},
			{ $unwind: "$allSources" },
			{
				$project: {
					_id: 0,
					source: "$allSources",
					postings: {
						$let: {
							vars: { match: { $first: { $filter: { input: "$postings", as: "p", cond: { $eq: ["$$p._id", "$allSources"] } } } } },
							in: { $ifNull: [ "$$match.count", 0 ] }
						}
					},
					applied: {
						$let: {
							vars: { match: { $first: { $filter: { input: "$applied", as: "a", cond: { $eq: ["$$a._id", "$allSources"] } } } } },
							in: { $ifNull: [ "$$match.count", 0 ] }
						}
					},
					scheduled: {
						$let: {
							vars: { match: { $first: { $filter: { input: "$scheduled", as: "s", cond: { $eq: ["$$s._id", "$allSources"] } } } } },
							in: { $ifNull: [ "$$match.count", 0 ] }
						}
					},
					declined: {
						$let: {
							vars: { match: { $first: { $filter: { input: "$declined", as: "d", cond: { $eq: ["$$d._id", "$allSources"] } } } } },
							in: { $ifNull: [ "$$match.count", 0 ] }
						}
					}
				}
			}
		]).toArray();

		res.json({ success: true, data: jobSourceSummary });
	} catch (err) {
		console.error('GET /api/reports/job-source-summary error', err);
		res.status(500).json({ success: false, error: err.message });
	}
}

export async function getJobPostingFrequency(req, res) {
	try {
		if (!jobsCollection) {
			return res.status(503).json({ success: false, error: "Database not ready" });
		}

		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(0);
		const end = endDate ? new Date(endDate) : new Date();

		const data = await jobsCollection.aggregate([
			{
				$match: {
					$expr: {
						$and: [
							{ $gte: [ { $toDate: "$postedAt" }, start ] },
							{ $lte: [ { $toDate: "$postedAt" }, end ] }
						]
					}
				}
			},
			{
				$project: {
					date: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$postedAt" } } },
					hour: { $hour: { $toDate: "$postedAt" } }
				}
			},
			{
				$group: {
					_id: {
						date: "$date",
						hour: "$hour"
					},
					count: { $sum: 1 }
				}
			},
			{
				$group: {
					_id: "$_id.date",
					hourlyData: {
						$push: {
							hour: "$_id.hour",
							count: "$count"
						}
					}
				}
			},
			{
				$sort: { _id: 1 }
			}
		]).toArray();

		res.json({ success: true, data });
	} catch (err) {
		console.error('GET /api/reports/job-posting-frequency error', err);
		res.status(500).json({ success: false, error: err.message });
	}
}

export async function getJobApplicationFrequency(req, res) {
	try {
		if (!jobsCollection) {
			return res.status(503).json({ success: false, error: "Database not ready" });
		}

		const { startDate, endDate } = req.query;
		let applierId = null;
		if (req.query?.applierName && accountInfoCollection) {
			const applier = await accountInfoCollection.findOne({ name: req.query.applierName });
			applierId = applier?._id || null;
		}
		const start = startDate ? new Date(startDate) : new Date(0);
		const end = endDate ? new Date(endDate) : new Date();

		const data = await jobsCollection.aggregate([
			{ $unwind: "$status" },
			{
				$match: Object.assign(
					{ $and: [
						{ "status.appliedDate": { $exists: true } },
						{ $expr: { $gte: [ { $toDate: "$status.appliedDate" }, start ] } },
						{ $expr: { $lte: [ { $toDate: "$status.appliedDate" }, end ] } }
					] },
					applierId ? { "status.applier": applierId } : {}
				)
			},
			{
				$project: {
					date: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$status.appliedDate" } } },
					hour: { $hour: { $toDate: "$status.appliedDate" } }
				}
			},
			{
				$group: {
					_id: {
						date: "$date",
						hour: "$hour"
					},
					count: { $sum: 1 }
				}
			},
			{
				$group: {
					_id: "$_id.date",
					hourlyData: {
						$push: {
							hour: "$_id.hour",
							count: "$count"
						}
					}
				}
			},
			{
				$sort: { _id: 1 }
			}
		]).toArray();

		res.json({ success: true, data });
	} catch (err) {
		console.error('GET /api/reports/job-application-frequency error', err);
		res.status(500).json({ success: false, error: err.message });
	}
}
