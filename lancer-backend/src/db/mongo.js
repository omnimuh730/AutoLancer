
import { MongoClient } from "mongodb";

let mongoClient;
let jobsCollection;
let companyCategoryCollection;
let skillsCategoryCollection;
let personalInfoCollection;
let accountInfoCollection;
let rulesCollection;

async function initMongo() {
	const mongoUrl = process.env.MONGO_URL;
	const mongoDbName = process.env.MONGO_DB || 'AIMS_local';
	mongoClient = new MongoClient(mongoUrl);
	await mongoClient.connect();
	const db = mongoClient.db(mongoDbName);
	jobsCollection = db.collection('job_market');
	companyCategoryCollection = db.collection('company_category');
	skillsCategoryCollection = db.collection('skills_category');
	personalInfoCollection = db.collection('personal_info');
	accountInfoCollection = db.collection('account_info');
	rulesCollection = db.collection('rules');
	console.log('Connected to MongoDB', mongoUrl, 'DB:', mongoDbName);

	await ensureJobMarketIndexes(jobsCollection);
}

/** Idempotent indexes for common job list queries (postedAt sort + filters). */
async function ensureJobMarketIndexes(collection) {
	if (!collection) return;
	try {
		await collection.createIndex({ postedAt: -1 });
		await collection.createIndex({ url: 1 });
	} catch (e) {
		console.warn('ensureJobMarketIndexes:', e.message);
	}
}

async function closeMongo() {
	if (mongoClient) {
		await mongoClient.close();
		mongoClient = null;
	}
}

export {
	initMongo,
	jobsCollection,
	companyCategoryCollection,
	skillsCategoryCollection,
	personalInfoCollection,
	accountInfoCollection,
	rulesCollection,
	closeMongo
};
