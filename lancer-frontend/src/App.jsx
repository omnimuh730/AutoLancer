import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

import PropTypes from "prop-types";
import { createTheme } from "@mui/material/styles";
import { Box, CircularProgress } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import NameCombobox from "./components/NameCombobox";
import { DemoProvider } from "@toolpad/core/internal";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AutomationPage = lazy(() => import("./pages/AutomationPage"));
const ReportPage = lazy(() => import("./pages/ReportsPage"));
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { AutoAwesome, Settings, Visibility } from "@mui/icons-material";
import { useAuth } from "./context/AuthContext";

import useSocket from "./api/useSocket";
import useNotification from "./api/useNotification";

import { SOCKET_PROTOCOL } from "../../configs/socket_protocol";
//import { SOCKET_MESSAGE } from "../../configs/message_template";

const NAVIGATION = [
	{
		kind: "header",
		title: "Main items",
	},
	{
		segment: "dashboard",
		title: "Dashboard",
		icon: <DashboardIcon />,
	},
	{
		segment: "automation",
		title: "Automation",
		icon: <AutoAwesome />,
	},
	{
		kind: "divider",
	},
	{
		kind: "header",
		title: "Analytics",
	},
	{
		segment: "reports",
		title: "Reports",
		icon: <BarChartIcon />,
	},
	{
		segment: "settings",
		title: "Settings",
		icon: <Settings />,
	},
	{
		segment: "logs",
		title: "Logs",
		icon: <Visibility />,
	},
];

const baseFontFamily = '"Source Sans 3", "Segoe UI", Arial, sans-serif';

const demoTheme = createTheme({
	cssVariables: {
		colorSchemeSelector: "data-toolpad-color-scheme",
	},
	colorSchemes: { light: true, dark: true },
	breakpoints: {
		values: {
			xs: 0,
			sm: 600,
			md: 600,
			lg: 1200,
			xl: 1536,
		},
	},
	typography: {
		fontFamily: baseFontFamily,
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					fontFamily: baseFontFamily,
				},
			},
		},
	},
});

// Custom router that bridges React Router with Toolpad
function useCustomRouter() {
	const location = useLocation();
	const navigate = useNavigate();

	return {
		pathname: location.pathname,
		push: (path) => navigate(path),
		replace: (path) => navigate(path, { replace: true }),
		navigate: (path) => navigate(path), // Add navigate function that Toolpad expects
	};
}

const routeFallback = (
	<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 280 }}>
		<CircularProgress />
	</Box>
);

function AppContent() {
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return (
			<Routes>
				<Route path="/signin" element={<SignInPage />} />
				<Route path="/signup" element={<SignUpPage />} />
				<Route path="*" element={<SignInPage />} />
			</Routes>
		);
	}

	return (
		<Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
			<Suspense fallback={routeFallback}>
				<Routes>
					<Route path="/dashboard" element={<DashboardPage />} />
					<Route path="/settings" element={<SettingsPage />} />
					<Route path="/automation" element={<AutomationPage />} />
					<Route path="/reports" element={<ReportPage />} />
					<Route path="/signin" element={<SignInPage />} />
					<Route path="/signup" element={<SignUpPage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Routes>
			</Suspense>
		</Box>
	);
}

function App(props) {
	const { window } = props;
	const router = useCustomRouter();
	const demoWindow = window !== undefined ? window() : undefined;

	const socket = useSocket();
	const notification = useNotification();

	useEffect(() => {

		if (socket) {
			socket.on("connect", () => {
				notification.success("Socket connected");
			});

			socket.on(SOCKET_PROTOCOL.TYPE.CONNECTION, (data) => {
				switch (data.payload.purpose) {
					case SOCKET_PROTOCOL.IDENTIFIER.PURPOSE.CHECK_CONNECTIONS:
						if (data.payload.src === SOCKET_PROTOCOL.LOCATION.EXTENSION && data.payload.tgt === SOCKET_PROTOCOL.LOCATION.FRONTEND) {
							//Level 2 Connection check -> Reply to Extension
							socket.emit(SOCKET_PROTOCOL.TYPE.CONNECTION, {
								...data.payload,
								timestamp: new Date().toISOString(),
								src: SOCKET_PROTOCOL.LOCATION.FRONTEND,
								tgt: SOCKET_PROTOCOL.LOCATION.EXTENSION,
							});
						}
				}
			});

			socket.on("disconnect", (reason) => {
				notification.error(`Socket disconnected: ${reason}`);
			});
		}
	}, [socket, notification]);

	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return (
			<DemoProvider window={demoWindow}>
				<AppContent />
			</DemoProvider>
		);
	}

	return (
		<DemoProvider window={demoWindow}>
			<AppProvider
				navigation={NAVIGATION}
				branding={{
					logo: <img src="./../src/assets/logo.png" alt="AutoLancer logo" />,
					title: 'AutoLancer',
					homeUrl: '/',
				}}
				router={router}
				theme={demoTheme}
				window={demoWindow}
			>
				<DashboardLayout slots={{ toolbarActions: NameCombobox }}>
					<AppContent />
				</DashboardLayout>
			</AppProvider>
		</DemoProvider>
	);
}

App.propTypes = {
	window: PropTypes.func,
};

export default App;
