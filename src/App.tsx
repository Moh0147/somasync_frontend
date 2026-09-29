import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt'

function App() {
  return (
    <AppProviders>
      <AppRouter />
      <UpdatePrompt />
    </AppProviders>
  )
}

export default App
