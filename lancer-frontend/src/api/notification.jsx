import React, { createContext } from "react";
import { SnackbarProvider } from "notistack";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
	return (
		<SnackbarProvider
			maxSnack={6}
			anchorOrigin={{
				vertical: "top",
				horizontal: "right",
			}}
		>
			<NotificationContext.Provider value={null}>
				{children}
			</NotificationContext.Provider>
		</SnackbarProvider>
	);
};

export { NotificationContext };
