import * as React from 'react';
import PropTypes from 'prop-types';
import {
	Tabs,
	Tab,
	Box
} from '@mui/material';

import {
	AutoAwesome,
	TravelExplore,
	ZoomIn
} from '@mui/icons-material';

import ComponentTracker from './Tracker';
import ScrapperPage from './Scrapper';
import AgentPage from './Agent';

// Custom TabPanel component to handle tab content

function CustomTabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

CustomTabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		'aria-controls': `simple-tabpanel-${index}`,
	};
}

const TabInfo = [
	{
		label: 'Scrap',
		content: <ScrapperPage />,
		icon: <TravelExplore />,
	},
	{
		label: 'Tracker',
		content: <ComponentTracker />,
		icon: <ZoomIn />,
	},
	{
		label: 'Agent',
		content: <AgentPage />,
		icon: <AutoAwesome />
	}
]

export default function LayoutPage() {
	const [value, setValue] = React.useState(0);

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	return (
		<Box sx={{ width: '100%' }}>
			<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
				<Tabs value={value} onChange={handleChange} aria-label="basic tabs example" centered>
					{TabInfo.map((tab, index) => (
						<Tab
							key={index}
							label={tab.label}
							icon={tab.icon}
							{...a11yProps(index)}
						/>
					))}
				</Tabs>
			</Box>
			{TabInfo.map((tab, index) => (
				<CustomTabPanel key={index} value={value} index={index}>
					{tab.content}
				</CustomTabPanel>
			))}
		</Box>
	);
}
