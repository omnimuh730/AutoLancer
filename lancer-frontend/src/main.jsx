import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { SocketProvider } from "./api/socket.jsx";
import { NotificationProvider } from "./api/notification.jsx";
import { BrowserRouter } from "react-router-dom";
import { ApplierProvider } from "./context/ApplierContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
	<SocketProvider url={import.meta.env.VITE_SOCKET_URL}>
		<NotificationProvider>
			<AuthProvider>
				<ApplierProvider>
					<BrowserRouter>
						<App />
					</BrowserRouter>
				</ApplierProvider>
			</AuthProvider>
		</NotificationProvider>
	</SocketProvider>
);
