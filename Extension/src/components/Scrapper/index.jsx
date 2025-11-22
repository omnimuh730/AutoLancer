import React, { useState } from 'react';


import {
	Paper,
	Stack,
	Box,
	Stepper,
	Step,
	StepLabel,
	Button,
	Typography
} from '@mui/material';

import SetupComponent from './Setup';
import ScrapComponent from './Scrap';
import CompleteComponent from './Completion';

const steps = ['Set Up', 'Scrap', 'Complete'];

const SETUP_STEP = 0;
const SCRAP_STEP = 1;
const COMPLETE_STEP = 2;

const getStepContent = (step) => {
	switch (step) {
		case SETUP_STEP:
			return <SetupComponent />;
		case SCRAP_STEP:
			return <ScrapComponent />;
		case COMPLETE_STEP:
			return <CompleteComponent />;
		default:
			return <h1>Unknown step</h1>;
	}
};

const ScrapperPage = () => {

	const [activeStep, setActiveStep] = useState(0);

	const handleNext = () => {
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	const handleReset = () => {
		setActiveStep(0);
	};

	return (
		<Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
			<Stack spacing={3}>
				<h1>Scrap</h1>
				<Box sx={{ width: '100%' }}>
					<Stepper activeStep={activeStep}>
						{steps.map((label, index) => {
							const stepProps = {};
							const labelProps = {};
							return (
								<Step key={`${label} + ${index}`} {...stepProps}>
									<StepLabel {...labelProps}>{label}</StepLabel>
								</Step>
							);
						})}
					</Stepper>
					{activeStep === steps.length ? (
						<React.Fragment>
							<Typography sx={{ mt: 2, mb: 1 }}>
								All steps completed - you&apos;re finished
							</Typography>
							<Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
								<Box sx={{ flex: '1 1 auto' }} />
								<Button onClick={handleReset}>Reset</Button>
							</Box>
						</React.Fragment>
					) : (
						<React.Fragment>
							{getStepContent(activeStep)}
							<Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
								<Button
									color="inherit"
									disabled={activeStep === 0}
									onClick={handleBack}
									sx={{ mr: 1 }}
								>
									Back
								</Button>
								<Box sx={{ flex: '1 1 auto' }} />
								<Button onClick={handleNext}>
									{activeStep === steps.length - 1 ? 'Finish' : 'Next'}
								</Button>
							</Box>
						</React.Fragment>
					)}
				</Box>
			</Stack>
		</Paper>
	);
};

export default ScrapperPage;