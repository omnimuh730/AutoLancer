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
	const notification = useNotification();

	useEffect(() => {
		socket.on("notification", (msg) => {
			notification.success(`Socket: ${msg}`);
		});
		return () => socket.off("notification");
	}, [socket, notification]);

	useEffect(() => {
		const handleConnection = (data) => {
			console.log('Received data from backend:', data);
			notification.success('Received data from Nebula');
			// Reply back
			socket.emit(SOCKET_PROTOCOL.TYPE.CONNECTION, {
				from: 'extension',
				status: 'received',
				originalPayload: data.payload,
			});
		};

		socket.on(SOCKET_PROTOCOL.TYPE.CONNECTION, handleConnection);

		return () => {
			socket.off(SOCKET_PROTOCOL.TYPE.CONNECTION, handleConnection);
		};
	}, [socket, notification]);

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