import { useEffect } from "react";
import {
	createTheme,
	ThemeProvider,
	CssBaseline,
	Container,
	Box,
} from "@mui/material";
import useSocket from './api/useSocket';
import useNotification from "./api/useNotification";
import { SOCKET_PROTOCOL } from "../../configs/socket_protocol.js";

import LayoutPage from "./components/layout";


const darkTheme = createTheme({
	palette: {
		mode: "dark",
	},
});

function App() {

	const socket = useSocket();
	const { success: notifySuccess } = useNotification();

	useEffect(() => {
		if (!socket) return undefined;
		const notificationHandler = (msg) => {
			notifySuccess(`Socket: ${msg}`);
		};
		socket.on("notification", notificationHandler);
		return () => socket.off("notification", notificationHandler);
	}, [socket, notifySuccess]);

	useEffect(() => {
		if (!socket) return undefined;
		const handleConnection = (data) => {
			const payload = data?.payload ?? {};
			const { src, tgt } = payload;

			// Ignore messages that originated from this extension or target someone else
			if (src === SOCKET_PROTOCOL.LOCATION.EXTENSION) {
				return;
			}
			if (tgt && tgt !== SOCKET_PROTOCOL.LOCATION.EXTENSION) {
				return;
			}

			// Avoid infinite echo loops when we receive our own acknowledgement back
			const alreadyAcknowledged =
				data?.status === 'received' ||
				data?.payload?.status === 'received' ||
				typeof data?.originalPayload !== 'undefined';

			if (alreadyAcknowledged) {
				return;
			}

			console.log('Received data from backend:', data);
			notifySuccess('Received data from Nebula');

			// Reply back just once per backend message
			socket.emit(SOCKET_PROTOCOL.TYPE.CONNECTION, {
				from: SOCKET_PROTOCOL.LOCATION.EXTENSION,
				status: 'received',
				originalPayload: data.payload,
			});
		};

		socket.on(SOCKET_PROTOCOL.TYPE.CONNECTION, handleConnection);

		return () => {
			socket.off(SOCKET_PROTOCOL.TYPE.CONNECTION, handleConnection);
		};
	}, [socket, notifySuccess]);

	return (
		<ThemeProvider theme={darkTheme}>
			<CssBaseline />
			<Container maxWidth="sm" sx={{ py: 2 }}>
				<Box sx={{ textAlign: 'center', mb: 3 }}>
					<LayoutPage />
				</Box>
			</Container>
		</ThemeProvider>
	);
}

// Snackbar/Alert JSX appended near top-level return via fragment or portal. We'll insert it before export by editing the return to include it.


export default App;
