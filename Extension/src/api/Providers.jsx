import { SocketProvider } from './socket.jsx'
import { NotificationProvider } from './notification.jsx'
import { RuntimeProvider } from './runtime.jsx'

const Providers = ({ children }) => {
  return (
    <SocketProvider url={import.meta.env.VITE_SOCKET_URL}>
      <NotificationProvider>
        <RuntimeProvider>
          {children}
        </RuntimeProvider>
      </NotificationProvider>
    </SocketProvider>
  )
}

export default Providers
