import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from 'cors';

import { initMongo } from "./src/db/mongo.js";
import { setupWebSocket } from "./src/websocket/handler.js";
import { setSocketIO } from "./src/controllers/openTabsController.js";

import openTabsRoutes from "./src/routes/openTabsRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import personalInfoRoutes from "./src/routes/personalInfoRoutes.js";
import skillCategoryRoutes from "./src/routes/skillCategoryRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import accountInfoRoutes from "./src/routes/accountInfoRoutes.js";
import ruleRoutes from "./src/routes/ruleRoutes.js";

const app = express();
const port = process.env.PORT;

app.use(express.json({ limit: '50mb' }));
app.use(cors({ origin: '*' }));

initMongo().catch(err => {
	console.error('Failed to connect to MongoDB', err);
	process.exit(1);
});

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

setupWebSocket(io);
setSocketIO(io); // Pass the io instance to the controller

// Setup routes
app.use('/api', openTabsRoutes);
app.use('/api', jobRoutes);
app.use('/api', personalInfoRoutes);
app.use('/api', skillCategoryRoutes);
app.use('/api', reportRoutes);
app.use('/api', accountInfoRoutes);
app.use('/api', ruleRoutes);

server.listen(port, process.env.HOST || 'localhost', () => {
	console.log(`Server running on http://${process.env.HOST || 'localhost'}:${port}`);
});