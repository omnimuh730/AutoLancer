
import { SOCKET_PROTOCOL } from "../../../configs/socket_protocol.js";

function setupWebSocket(io) {
	io.on("connection", (socket) => {
		console.log("A user connected:", socket.id);

		socket.on(SOCKET_PROTOCOL.TYPE.CONNECTION, (data) => {
			//Broadcast-reply(amplifying) all messages to all connected clients every receiving - backend works like intermidiate server
			io.emit(SOCKET_PROTOCOL.TYPE.CONNECTION, {
				timestamp: new Date().toISOString(),
				payload: data || {},
			});
		});

		socket.on("disconnect", () => {
			console.log("User disconnected:", socket.id);
		});
	});
}

export { setupWebSocket };
