import { z } from "zod";

export function registerProfileTools(mcpServer, profile) {
	// Helper to wrap JSON into a tool result
	const asStructured = (obj) => ({ structuredContent: obj });

	// Grouped
	mcpServer.registerTool(
		"getBasicInfo",
		{ description: "Retrieve all personal information fields (grouped)." },
		async () => asStructured(profile.personal)
	);
	mcpServer.registerTool(
		"getContactInfo",
		{ description: "Retrieve all contact information fields (grouped)." },
		async () => asStructured(profile.contact)
	);
	mcpServer.registerTool(
		"getEducationInfo",
		{ description: "Fetch education details such as university, degree, and date range." },
		async () => asStructured(profile.education)
	);
	mcpServer.registerTool(
		"getCompanyHistory",
		{ description: "Retrieve full company career history." },
		async () => asStructured({ totalCompanies: profile.career.length, positions: profile.career })
	);
	mcpServer.registerTool(
		"getFullProfile",
		{ description: "Return the full profile object." },
		async () => asStructured(profile)
	);

	// Personal (atomic)
	mcpServer.registerTool("getName", { description: "Return only the full name." }, async () => asStructured(profile.personal.name));
	mcpServer.registerTool("getBirthday", { description: "Return only the birthday." }, async () => asStructured(profile.personal.birthday));
	mcpServer.registerTool("getAddress", { description: "Return only the full address." }, async () => asStructured(profile.personal.address));
	mcpServer.registerTool("getZip", { description: "Return only the ZIP code." }, async () => asStructured(profile.personal.zip));
	mcpServer.registerTool("getLocation", { description: "Return only the city and state location." }, async () => asStructured(profile.personal.location));

	// Contact (atomic)
	mcpServer.registerTool("getEmail", { description: "Return only Bryan’s email address." }, async () => asStructured(profile.contact.email));
	mcpServer.registerTool("getPhoneNumber", { description: "Return only Bryan’s phone number." }, async () => asStructured(profile.contact.phone));
	mcpServer.registerTool("getLinkedIn", { description: "Return only Bryan’s LinkedIn profile URL." }, async () => asStructured(profile.contact.linkedin));
	mcpServer.registerTool("getGitHub", { description: "Return only Bryan’s GitHub URL." }, async () => asStructured(profile.contact.github));

	// Education (atomic)
	mcpServer.registerTool("getUniversity", { description: "Return only university name." }, async () => asStructured(profile.education.university));
	mcpServer.registerTool("getDegree", { description: "Return only the degree title." }, async () => asStructured(profile.education.degree));
	mcpServer.registerTool("getEducationStartDate_FullDate", { description: "Return education starting date." }, async () => asStructured(profile.education.startDate));
	mcpServer.registerTool("getEducationEndDate_FullDate", { description: "Return education end date." }, async () => asStructured(profile.education.endDate));

	// Company search (with input validation)
	mcpServer.registerTool(
		"findCompanyByName",
		{
			description: "Find company details by exact name.",
			inputSchema: z.object({ company: z.string().describe("Company name to search (case-insensitive)") })
		},
		async ({ company }) => {
			const result = profile.career.find((c) => c.company.toLowerCase() === String(company).toLowerCase());
			return asStructured(result || { message: "Company not found" });
		}
	);

	// Resume selection for a given job description (currently hardcoded to Python + React)
	mcpServer.registerTool(
		"resumeForJobDescription",
		{
			description: "Return resume and cover letter paths for a given job description.",
			inputSchema: z.object({ jobDescription: z.string().optional().describe("Raw job description text (optional)") })
		},
		async ({ jobDescription }) => {
			const resumePath = "D:\\Job Hunting\\Profiles\\Bryan Reyes\\Python + React\\Bryan Reyes.pdf";
			const coverLetterPath = "D:\\Job Hunting\\Profiles\\Bryan Reyes\\Cover Letter.pdf";
			return asStructured({
				profile: "Python + React",
				resumePath,
				coverLetterPath,
				basedOn: jobDescription ? 'jobDescription' : 'default'
			});
		}
	);

	// Normal question & answer tool (placeholder)
	mcpServer.registerTool(
		"normalQuestionAnswer",
		{
			description: "Return an answer for a normal interview question.",
			inputSchema: z.object({ question: z.string().describe("The question to answer") })
		},
		async ({ question }) => asStructured({ answer: "Answer is not prepared yet." })
	);

	// EEO & Work Authorization tools
	mcpServer.registerTool("getRace", { description: "Return EEO race selection." }, async () => asStructured(profile.eeo?.race || "Prefer not to say"));
	mcpServer.registerTool("getGender", { description: "Return gender selection." }, async () => asStructured(profile.eeo?.gender || "Prefer not to say"));
	mcpServer.registerTool("getVeteranStatus", { description: "Return veteran status selection (Yes/No)." }, async () => asStructured(profile.eeo?.veteranStatus || "No"));
	mcpServer.registerTool("getDisabilityStatus", { description: "Return disability status selection (Yes/No)." }, async () => asStructured(profile.eeo?.disabilityStatus || "No"));
	mcpServer.registerTool("getWorkAuthorization", { description: "Return work authorization statement." }, async () => asStructured(profile.work?.workAuthorization || "Authorized to work in the US"));

	// Career tools
	mcpServer.registerTool("getCareerPositions", { description: "Return array of career positions." }, async () => asStructured(profile.career));
}
