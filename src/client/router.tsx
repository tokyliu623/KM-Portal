import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { TokenManage } from './pages/TokenManage'
import { KBBrowser } from './pages/KBBrowser'
import { DocEditor } from './pages/DocEditor'
import { SkillGen } from './pages/SkillGen'
import { ApiDocs } from './pages/ApiDocs'
import { WizardPage } from './pages/Wizard'
import KMStudioPage from './pages/Wizard/KMStudioPage'
import { Stats } from './pages/Stats'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tokens" element={<TokenManage />} />
        <Route path="browser" element={<KBBrowser />} />
        <Route path="editor" element={<DocEditor />} />
        <Route path="skill-gen" element={<SkillGen />} />
        <Route path="api-docs" element={<ApiDocs />} />
        <Route path="wizard" element={<WizardPage />} />
        <Route path="km-studio" element={<KMStudioPage />} />
        <Route path="stats" element={<Stats />} />
      </Route>
    </Routes>
  )
}