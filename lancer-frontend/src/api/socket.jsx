import React, { createContext, useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children, url }) => {
	const socketRef = useRef();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		socketRef.current = io(url);
		setReady(true);
		return () => {
			socketRef.current.disconnect();
			setReady(false);
		};
	}, [url]);

	if (!ready) return null;

	return (
		<SocketContext.Provider value={socketRef.current}>
			{children}
		</SocketContext.Provider>
	);
};

export { SocketContext };
