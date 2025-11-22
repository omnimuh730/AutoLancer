//Setup Component
/*
This component is responsible for the setup step in the scrapping process.

What it does:
- Checkout Level1 Socket.io connection(Extension -> backend -> Extension)
- Checkout Level2 Socket.io connection(Extension -> backend -> Monitor Frontend -> backend -> Extension)
- Checkout if Jobright website is opened for scrapping
*/

import { useEffect, useState } from 'react';
import {
	Card,
	CardContent,
	Typography,
	Stack,
	Chip,
	CircularProgress,
	Divider
} from '@mui/material';

import useNotification from '../../../api/useNotification';
import useSocket from '../../../api/useSocket';

import { SOCKET_PROTOCOL } from '../../../../../configs/socket_protocol';
import { SOCKET_MESSAGE } from '../../../../../configs/message_template';

const StatusRow = ({ label, isConnected, successText, failText }) => (
	<Stack direction="row" alignItems="center" spacing={2}>
		<Typography variant="body1" sx={{ minWidth: 220 }}>
			{label}
		</Typography>
		{isConnected ? (
			<Chip label={successText} color="success" variant="outlined" />
		) : (
			<Stack direction="row" spacing={1} alignItems="center">
				<CircularProgress size={14} thickness={5} />
				<Chip label={failText} color="error" variant="outlined" />
			</Stack>
		)}
	</Stack>
);

const SetupComponent = () => {
	// Call the hook to get the socket instance
	const socket = useSocket();

	// Call the notification hook at top level (HOOKS must be called at top-level)
	const notification = useNotification();

	const [isLevel1Connected, setIsLevel1Connected] = useState(false);
	const [isLevel2Connected, setIsLevel2Connected] = useState(false);

	useEffect(() => {
		if (socket) {
			// Level 1 connection check
			// Emit a connection event to check Level 1 connection
			// The backend should respond with a 'connection' event
			// indicating the status of the connection
			socket.emit(SOCKET_PROTOCOL.TYPE.CONNECTION, {
				src: SOCKET_PROTOCOL.LOCATION.EXTENSION,
				tgt: SOCKET_PROTOCOL.LOCATION.EXTENSION,
				purpose: SOCKET_PROTOCOL.IDENTIFIER.PURPOSE.CHECK_CONNECTIONS,
				body: {
					level: 1,
					message: 'SetupComponent mounted and checking connections for level1'
				},
				timestamp: new Date().toISOString()
			})
			// Level 2 Connection Check
			socket.emit(SOCKET_PROTOCOL.TYPE.CONNECTION, {
				src: SOCKET_PROTOCOL.LOCATION.EXTENSION,
				tgt: SOCKET_PROTOCOL.LOCATION.FRONTEND,
				purpose: SOCKET_PROTOCOL.IDENTIFIER.PURPOSE.CHECK_CONNECTIONS,
				body: {
					level: 2,
					message: 'SetupComponent mounted and checking connections for level2'
				},
				timestamp: new Date().toISOString()
			});

			socket.on(SOCKET_PROTOCOL.TYPE.CONNECTION, (data) => {
				switch (data.payload.purpose) {
					case SOCKET_PROTOCOL.IDENTIFIER.PURPOSE.CHECK_CONNECTIONS:
						// Handle the check_connections purpose
						if (data.payload.src === SOCKET_PROTOCOL.LOCATION.EXTENSION && data.payload.tgt === SOCKET_PROTOCOL.LOCATION.EXTENSION) {
							setIsLevel1Connected(true);
							notification.success(SOCKET_MESSAGE.LEVEL1_CONNECTED);
						}
						if (data.payload.src === SOCKET_PROTOCOL.LOCATION.FRONTEND && data.payload.tgt === SOCKET_PROTOCOL.LOCATION.EXTENSION) {
							setIsLevel2Connected(true);
							notification.success(SOCKET_MESSAGE.LEVEL2_CONNECTED);
						}
						break;
					// Add more cases as needed
					default:
						break;
				}
			});

			socket.on(SOCKET_PROTOCOL.STATUS.DISCONNECTED, (reason) => {
				notification.error(`${SOCKET_MESSAGE.LEVEL1_DISCONNECTED} - ${reason}`);
				setIsLevel1Connected(false);
			});

			// Cleanup on unmount
			return () => {
				socket.off(SOCKET_PROTOCOL.TYPE.CONNECTION);
				socket.off(SOCKET_PROTOCOL.STATUS.DISCONNECTED);
			};
		}
	}, [socket, notification]);

	return (
		<Card sx={{ maxWidth: 500, mx: 'auto', mt: 4, borderRadius: 3, boxShadow: 3 }}>
			<CardContent>
				<Typography variant="h5" gutterBottom>
					Setup Step
				</Typography>
				<Divider sx={{ mb: 2 }} />

				<Stack spacing={2}>
					<StatusRow
						label="Level 1 Connection"
						isConnected={isLevel1Connected}
						successText="Connected"
						failText="Not Connected"
					/>
					<StatusRow
						label="Level 2 Connection"
						isConnected={isLevel2Connected}
						successText="Connected"
						failText="Not Connected"
					/>
				</Stack>
			</CardContent>
		</Card>
	);
};

export default SetupComponent;
