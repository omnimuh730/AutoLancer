import { useState, useEffect, useRef } from 'react';

import {
	Button,
	Divider,
	CircularProgress,
	Typography,
	Paper,
	Stack,
	Box,
} from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';
import PropTypes from 'prop-types'
import { useRuntime } from '../../../api/runtimeContext';
import useApi from '../../../api/useApi';
import { handleClear, handleAction, handleHighlight } from '../../../contentScript/interactionBridge';
function CircularProgressWithLabel(props) {
	return (
		<Box sx={{ position: 'relative', display: 'inline-flex' }}>
			<CircularProgress variant="determinate" {...props} />
			<Box
				sx={{
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					position: 'absolute',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Typography
					variant="caption"
					component="div"
					sx={{ color: 'text.secondary' }}
				>
					{`${Math.round(props.value)}%`}
				</Typography>
			</Box>
		</Box>
	);
}

CircularProgressWithLabel.propTypes = {
	/**
	 * The value of the progress indicator for the determinate variant.
	 * Value between 0 and 100.
	 * @default 0
	 */
	value: PropTypes.number.isRequired,
};

const ScrapComponent = () => {
	// Mock delay function
	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	const [progress, setProgress] = useState(0);
	const [scrapFlag, setScrapFlag] = useState(false);

	const { addListener, removeListener } = useRuntime();
	const api = useApi(import.meta.env.VITE_API_URL);
	// Map of pending resolvers for fetch requests by identifier
	const pendingResolvers = useRef(new Map());

	const [scrappedCount, setScrappedCount] = useState(0);

	useEffect(() => {
		const listener = (message) => {
			if (message?.action === 'to-extension') {
				// placeholder for future UI notifications
			}

			if (message?.action === 'fetchResult') {
				// message.payload should include { identifier?, success, data, error }
				const id = message.payload?.identifier;
				// store result in state
				if (id) {
					const resolver = pendingResolvers.current.get(id);
					if (resolver) {
						resolver(message.payload);
						pendingResolvers.current.delete(id);
					}
				}
			}
		};
		addListener(listener);
		return () => removeListener(listener);
	}, [addListener, removeListener]);

	async function onClickListItem() {
		handleClear();
		// Handle the click event for the list item
		handleHighlight("div", "class", "?index_job-card-main-flip1-?");
		handleAction("div", "class", "?index_job-card-main-flip1-?", 0, "click", "");
		await delay(250);
		handleClear();
		setProgress(10);

		handleClear();

		//Wait still job details screen is showing.
		let id = `scrap_wait_for_details_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_waitfor_jobdetails = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("div", "class", "?index_jobdetail-enter?", 0, "fetch", null, "text", id);
		await promise_waitfor_jobdetails;
		await delay(250);

		//<img alt="company-logo" loading="lazy" width="44" height="44" decoding="async" data-nimg="1" class="index_company-logo-img__AE9Vx" src="https://media.licdn.com/dms/image/v2/C4D0BAQGJi1QGUgQtAA/company-logo_100_100/company-logo_100_100/0/1644946892309/emids_logo?e=2147483647&amp;v=beta&amp;t=BeIEzLKIWNUgH7ZPLKTcU3BHQ1XqD2tjcwx1NgBLkw0" style="color: transparent;">
		//Fetch Company Logo URL
		handleHighlight("img", "class", "?index_company-logo-img__?");
		id = `scrap_logo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_logo = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("img", "class", "?index_company-logo-img__?", 0, "fetch", null, "src", id);
		const CompanyLogoComponent = await promise_logo;
		const CompanyLogo = CompanyLogoComponent?.success ? (new DOMParser().parseFromString(CompanyLogoComponent.data, 'text/html')).querySelector('img')?.src : null;
		handleClear();
		setProgress(12);
		await delay(100);
		handleClear();

		handleHighlight("a", "class", "?index_origin__?");
		id = `scrap_apply_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_applyLink = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("a", "class", "?index_origin__?", 0, "fetch", null, "content", id);
		const LinkComponent = await promise_applyLink;

		const ApplyLink = LinkComponent?.success ? (new DOMParser().parseFromString(LinkComponent.data, 'text/html')).querySelector('a')?.href : null;
		setProgress(15);
		await delay(100);
		handleClear();

		handleHighlight("div", "class", "?index_jobTag__?");
		id = `scrap_applicants_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_jobTag = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("div", "class", "?index_jobTag__?", 0, "fetch", null, "text", id);
		const ApplicantsNumber = await promise_jobTag;
		setProgress(20);
		await delay(100);
		handleClear();

		handleHighlight("h2", "class", "?index_company-row__?");
		id = `scrap_company_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_companyRow = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("h2", "class", "?index_company-row__?", 0, "fetch", null, "content", id);
		/*
		<h2 class="ant-typography index_company-row__vOzgg css-120qcz2" style=""><strong>Revecore</strong><span class="index_publish-time___q_uC"> · 10 hours ago</span></h2>
		Need to get each 2 text item - strong tag(company name) and span tag(publish time)
		Remove ` · ` from the publish time
		*/
		const CompanyRawComponent = await promise_companyRow;
		let CompanyName = null;
		let PublishTime = null;

		if (CompanyRawComponent?.success) {
			const doc = new DOMParser().parseFromString(CompanyRawComponent.data, 'text/html');
			const spans = doc.querySelectorAll('span');

			CompanyName = spans[0]?.innerText || null;
			PublishTime = spans[1]?.innerText.replace(' · ', '') || null;
		}

		setProgress(25);
		await delay(100);
		handleClear();

		handleHighlight("h1", "class", "?index_job-title__?");
		id = `scrap_title_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_jobTitle = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("h1", "class", "?index_job-title__?", 0, "fetch", null, "text", id);
		const JobTitle = await promise_jobTitle;
		setProgress(30);
		await delay(100);
		handleClear();

		handleHighlight("div", "class", "?index_job-metadata-row__?");
		id = `scrap_meta_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_job_metadata = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("div", "class", "?index_job-metadata-row__?", 0, "fetch", null, "content", id);

		const MetaTagsComponent = await promise_job_metadata;
		const MetaTags = MetaTagsComponent?.success ? Array.from((new DOMParser().parseFromString(MetaTagsComponent.data, 'text/html')).querySelectorAll('div.index_job-metadata-item__Wv_Xh')).reduce((acc, div) => {
			const key = div.querySelector('img')?.alt;
			const value = div.querySelector('span')?.innerText;
			if (key && value) {
				acc[key] = value;
			}
			return acc;
		}, {}) : {};
		setProgress(35);
		await delay(100);
		handleClear();

		handleHighlight("p", "class", "?index_company-summary__?");
		id = `scrap_summary_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_company_summary = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("p", "class", "?index_company-summary__?", 0, "fetch", null, "text", id);
		const CompanySummary = await promise_company_summary;
		setProgress(40);
		await delay(100);
		handleClear();

		handleHighlight("div", "class", "?index_companyTags?");
		id = `scrap_tags_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_companyTags = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("div", "class", "?index_companyTags?", 0, "fetch", null, "content", id);
		/* <div class="index_companyTags__Sb2uk ant-flex css-120qcz2" style="gap: 4px; outline: red solid 2px;" data-highlighter-original-outline="" data-highlighter-id="1" data-highlighter-outline="true"><span class="ant-tag css-120qcz2">Analytics</span><span class="ant-tag css-120qcz2">Management Consulting</span><span class="ant-tag css-120qcz2">Medical</span></div>

		Get Company Tags data as string array
		*/
		const CompanyTagsComponent = await promise_companyTags;
		const CompanyTags = CompanyTagsComponent?.success ? Array.from((new DOMParser().parseFromString(CompanyTagsComponent.data, 'text/html')).querySelectorAll('span.ant-tag')).map(span => span.innerText) : [];
		setProgress(45)
		await delay(100);
		handleClear();

		handleHighlight("section", "class", "?index_sectionContent__?");
		id = `scrap_resp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_sectionContent1 = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("section", "class", "?index_sectionContent__?", 2, "fetch", null, "text", id);
		const Responsibilities = await promise_sectionContent1;
		setProgress(50);
		await delay(100);
		handleClear();

		handleHighlight("section", "class", "?index_sectionContent__?");
		id = `scrap_qual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_sectionContent2 = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("section", "class", "?index_sectionContent__?", 3, "fetch", null, "text", id);
		const Qualification = await promise_sectionContent2;
		setProgress(55);
		await delay(100);
		handleClear();

		handleHighlight("section", "class", "?index_sectionContent__?");
		id = `scrap_ben_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_sectionContent3 = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("section", "class", "?index_sectionContent__?", 4, "fetch", null, "text", id);
		const Benefits = await promise_sectionContent3;
		setProgress(60);
		await delay(100);
		handleClear();

		handleHighlight("div", "class", "?index_skill-matching-tags-area__?");
		id = `scrap_skill_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const promise_skill_matching = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
		handleAction("div", "class", "?index_skill-matching-tags-area__?", 0, "fetch", null, "text", id);
		//Result: "Java\nSpring Boot\nMicroservices\nSQL\nRESTful APIs\nAgile Methodologies\nGit\nDocker\nKubernetes"
		const SkillMatching = await promise_skill_matching;
		const Skills = SkillMatching?.success ? SkillMatching.data.split('\n').map(s => s.trim()).filter(Boolean) : [];
		setProgress(65);
		handleClear();
		await delay(250);
		setProgress(70);

		handleHighlight("button", "id", "index_not-interest-button__?");
		// click
		handleAction("button", "id", "index_not-interest-button__?", 0, "click", "");
		await delay(250);
		setProgress(80);

		handleHighlight("li", "class", "ant-dropdown-menu-item ant-dropdown-menu-item-only-child");
		// click
		handleAction("li", "class", "ant-dropdown-menu-item ant-dropdown-menu-item-only-child", 0, "click", "");
		await delay(250);
		setProgress(100);

		/*

		handleHighlight("label", "class", "?index_not-interest-popup-radio-item?");
		await delay(250);
		// click
		handleAction("label", "class", "?index_not-interest-popup-radio-item?", 5, "click", "");
		await delay(250);
		setProgress(90);

		handleHighlight("button", "class", "?index_not-interest-popup-button__?");
		await delay(250);
		// click
		handleAction("button", "class", "?index_not-interest-popup-button__?", 1, "click", "");
		await delay(250);
		setProgress(100);
		handleClear();
		*/

		// Wait until job item list is showing
		// We need to wait until object_waitfor_joblist.success is false. If it gets true, step over, but if it's false, wait again to be true.
		let success_wait_for_job_list = false;

		while (!success_wait_for_job_list) {
			id = `scrap_wait_for_list_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
			const promise_waitfor_joblist = new Promise((resolve) => pendingResolvers.current.set(id, resolve));
			handleAction("div", "class", "?index_jobdetail-leave?", 0, "fetch", null, "content", id);
			const object_waitfor_joblist = await promise_waitfor_joblist;
			console.log('Waiting for job list to reappear...');

			success_wait_for_job_list = object_waitfor_joblist?.success;

			if (!success_wait_for_job_list) {
				// wait for 1.5 second before next check
				await delay(600);
			}
		}
		//Split the data by new line and trim each item
		const parseApplicantsTags = (data) => {
			return data.split('\n').map(tag => tag.trim()).filter(tag => tag);
		};

		const parsedTags = ApplicantsNumber?.success ? parseApplicantsTags(ApplicantsNumber.data) : [];

		const resultData = {
			applyLink: ApplyLink || "",
			id: Date.now(),
			postedAgo: PublishTime || "",
			tags: parsedTags,
			company: {
				name: CompanyName || "",
				tags: CompanyTags || [],
				logo: CompanyLogoComponent?.success ? CompanyLogo : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGRo4_tzLdMlx9Bzp9ZyFGo0VdeHbJt_rfYQ&s",
			},
			title: JobTitle?.success ? JobTitle.data : "",
			details: MetaTags || {},
			applicants: ApplicantsNumber?.success ? { count: parseInt(ApplicantsNumber.data.match(/\d+/)?.[0] || "0", 10), text: ApplicantsNumber.data } : { count: 0, text: "" },
			description: [Responsibilities?.success ? Responsibilities.data : "", Qualification?.success ? Qualification.data : "", Benefits?.success ? Benefits.data : ""].filter(s => s).join("\n\n"),
			skills: Skills || [],
		};
		console.log('Scrap completed, saving job to backend...');
		// Send to backend
		try {
			await api.post('/jobs', resultData);
			console.log('Job saved successfully');
			setScrappedCount(prev => prev + 1);
		} catch (err) {
			console.error('Failed to save job', err);
		}
		setProgress(0);
		handleClear();
		await delay(250);
	}

	useEffect(() => {
		let active = true; // cancellation flag

		const run = async () => {
			while (active && scrapFlag) {
				try {
					await onClickListItem(); // wait until it fully finishes
				} catch (err) {
					console.error("Error in onClickListItem:", err);
				}
			}
		};

		if (scrapFlag) {
			run(); // start the async loop
		}

		return () => {
			active = false; // stop when unmounted or scrapFlag changes
		};
	}, [scrapFlag]);
	const onScrapStart = () => {
		setScrapFlag(true);
	}

	const onScrapStop = () => {
		setScrapFlag(false);
		setProgress(0);
	}

	return (
		<Paper elevation={2} sx={{ p: 3, borderRadius: 2, maxWidth: 400, mx: 'auto' }}>
			<Stack spacing={2}>
				{/* Section 1: Title */}
				<Typography variant="h5" component="h2" gutterBottom>
					Scraping Controls
				</Typography>
				<Divider />

				{/* Section 2: Progress and Stats */}
				<Stack
					direction="row"
					spacing={2}
					justifyContent="space-around"
					alignItems="center"
					sx={{ py: 2 }}
				>
					<CircularProgressWithLabel size={60} value={progress} />
					<Box textAlign="center">
						<Typography variant="h6">{scrappedCount}</Typography>
						<Typography variant="body2" color="text.secondary">
							Items Scrapped
						</Typography>
					</Box>
				</Stack>

				{/* Section 3: Action Buttons */}
				<Stack direction="row" spacing={2} justifyContent="flex-end">
					<Button
						variant="outlined"
						color="error"
						onClick={onScrapStop}
						disabled={!scrapFlag}
						startIcon={<Stop />}
					>
						Stop
					</Button>
					<Button
						variant="contained"
						onClick={onScrapStart}
						disabled={scrapFlag}
						startIcon={<PlayArrow />}
					>
						Start
					</Button>
				</Stack>
			</Stack>
		</Paper>
	);
}

export default ScrapComponent;
