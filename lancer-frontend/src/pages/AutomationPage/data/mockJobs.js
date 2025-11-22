// src/mockJobs.js

export const mockJobs = [
	{
		id: 1,
		postedAgo: "22 minutes ago",
		tags: ["Be an early applicant", "2 former colleagues work here"],
		company: {
			name: "JRD Systems",
			logo: "https://via.placeholder.com/150/FFC107/000000?Text=JRD",
		},
		title: "Senior Java Developer",
		details: {
			location: "Downey, CA",
			isRemote: true,
			type: "Contract",
			level: "Senior Level",
			experience: "7+ years exp",
			salary: null,
		},
		applicants: {
			count: 24,
			text: "Less than 25 applicants",
		},
		description: `<strong>About the Role:</strong><br/>We are seeking a seasoned Senior Java Developer to join our dynamic team. The ideal candidate will have extensive experience in building high-performing, scalable, enterprise-grade applications.<br/><br/><strong>Responsibilities:</strong><ul><li>Design and develop high-volume, low-latency applications for mission-critical systems.</li><li>Contribute in all phases of the development lifecycle.</li><li>Write well-designed, testable, efficient code.</li></ul><strong>Requirements:</strong><ul><li>7+ years of proven working experience in Java development.</li><li>Hands on experience in designing and developing applications using Java EE platforms.</li><li>Object-Oriented analysis and design using common design patterns.</li></ul>`,
	},
	{
		id: 2,
		postedAgo: "3 hours ago",
		tags: [],
		company: {
			name: "Jobgether",
			logo: "https://via.placeholder.com/150/4CAF50/FFFFFF?Text=G",
		},
		title: "Frontend Engineer (Remote - US)",
		details: {
			location: "United States",
			isRemote: true,
			type: "Full-time",
			level: "Mid Level",
			experience: null,
			salary: "$140K/yr - $180K/yr",
		},
		applicants: {
			count: 132,
			text: "132 applicants",
		},
		description: `<strong>About the Role:</strong><br/>Jobgether is looking for a passionate Frontend Engineer to create beautiful and functional user interfaces. You will be responsible for developing and implementing user interface components using React.js concepts and workflows.<br/><br/><strong>Responsibilities:</strong><ul><li>Developing new user-facing features using React.js.</li><li>Building reusable components and front-end libraries for future use.</li><li>Translating designs and wireframes into high-quality code.</li></ul><strong>Requirements:</strong><ul><li>Strong proficiency in JavaScript, including DOM manipulation and the JavaScript object model.</li><li>Thorough understanding of React.js and its core principles.</li><li>Experience with popular React.js workflows (such as Flux or Redux).</li></ul>`,
	},
	// Add descriptions for other jobs as needed...
];
