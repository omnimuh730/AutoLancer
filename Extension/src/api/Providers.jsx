import { RuntimeProvider } from './runtime.jsx'

const Providers = ({ children }) => {
  return (
    <RuntimeProvider>
      {children}
    </RuntimeProvider>
  )
}

export default Providers
