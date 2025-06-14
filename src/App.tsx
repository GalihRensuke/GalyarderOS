import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'

// Core Components
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import ErrorBoundary from './components/common/ErrorBoundary'
import LoadingSpinner from './components/common/LoadingSpinner'

// Pages
import Dashboard from './pages/Dashboard'
import CommandCenter from './pages/CommandCenter'
import IdentityCore from './pages/IdentityCore'
import VisionArchitecture from './pages/VisionArchitecture'
import LifeBalance from './pages/LifeBalance'
import RitualEngine from './pages/RitualEngine'
import FlowState from './pages/FlowState'
import KnowledgeHub from './pages/KnowledgeHub'
import ReflectionIntelligence from './pages/ReflectionIntelligence'
import LifeAnalytics from './pages/LifeAnalytics'
import NotionIntegration from './pages/NotionIntegration'

// Providers
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AIProvider } from './contexts/AIContext'
import { NotionProvider } from './contexts/NotionContext'

function AppContent() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neural-900 via-neural-800 to-quantum-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Initializing GalyarderOS..." />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-neural-900 via-neural-800 to-quantum-900">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-6 overflow-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/command" element={<CommandCenter />} />
                  <Route path="/identity" element={<IdentityCore />} />
                  <Route path="/vision" element={<VisionArchitecture />} />
                  <Route path="/balance" element={<LifeBalance />} />
                  <Route path="/rituals" element={<RitualEngine />} />
                  <Route path="/flow" element={<FlowState />} />
                  <Route path="/knowledge" element={<KnowledgeHub />} />
                  <Route path="/reflection" element={<ReflectionIntelligence />} />
                  <Route path="/analytics" element={<LifeAnalytics />} />
                  <Route path="/notion" element={<NotionIntegration />} />
                </Routes>
              </motion.div>
            </main>
          </div>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'glass-morphism text-neural-50',
            duration: 4000,
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AIProvider>
          <NotionProvider>
            <AppContent />
          </NotionProvider>
        </AIProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App