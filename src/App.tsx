import { Route, Routes } from 'react-router-dom'
import NewBookPage from './pages/NewBookPage'
import StartPage from './pages/StartPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/books/new" element={<NewBookPage />} />
    </Routes>
  )
}

export default App
