
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
}

export {
	initMongo,
	jobsCollection,
	companyCategoryCollection,
	skillsCategoryCollection,
	personalInfoCollection,
	accountInfoCollection,
	rulesCollection
};
