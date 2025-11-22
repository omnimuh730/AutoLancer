import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { SocketProvider } from './api/socket.jsx'
import { NotificationProvider } from './api/notification.jsx'
import { RuntimeProvider } from './api/runtime.jsx'

createRoot(document.getElementById('root')).render(
	<SocketProvider url={import.meta.env.VITE_SOCKET_URL}>
		<NotificationProvider>
			<RuntimeProvider>
				<App />
			</RuntimeProvider>
		</NotificationProvider>
	</SocketProvider>
)
