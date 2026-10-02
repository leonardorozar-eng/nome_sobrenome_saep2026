import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './componentes/Layout'
import RotaProtegida from './componentes/RotaProtegida'
import Agendamentos from './pages/Agendamentos'
import Clientes from './pages/Clientes'
import Dentistas from './pages/Dentistas'
import Login from './pages/Login'
import Painel from './pages/Painel'

function Protegida({ children }) {
  return (
    <RotaProtegida>
      <Layout>{children}</Layout>
    </RotaProtegida>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protegida><Painel /></Protegida>} />
      <Route path="/dentistas" element={<Protegida><Dentistas /></Protegida>} />
      <Route path="/clientes" element={<Protegida><Clientes /></Protegida>} />
      <Route path="/agendamentos" element={<Protegida><Agendamentos /></Protegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
