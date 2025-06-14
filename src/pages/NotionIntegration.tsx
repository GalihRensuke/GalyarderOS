import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Link, Settings, Database, FolderSync as Sync, Search, Plus, CheckCircle, AlertCircle, ExternalLink, Target, Zap, Brain, Calendar, TestTube } from 'lucide-react'
import { useNotion } from '@/contexts/NotionContext'
import { useAI } from '@/contexts/AIContext'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function NotionIntegration() {
  const { user } = useAuth()
  const { integration, isConnected, isLoading, connectToNotion, disconnectFromNotion, syncData, searchContent, createContent, updateSyncSettings, testConnection } = useNotion()
  const { insights } = useAI()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Check connection status on mount
  useEffect(() => {
    if (isConnected) {
      handleTestConnection()
    }
  }, [isConnected])

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const isValid = await testConnection()
      if (isValid) {
        toast.success('Notion connection is working!')
      } else {
        toast.error('Notion connection failed')
      }
    } catch (error) {
      toast.error('Failed to test connection')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !isConnected) return

    setIsSearching(true)
    try {
      const results = await searchContent(searchQuery)
      setSearchResults(results)
      if (results.length === 0) {
        toast.info('No results found')
      }
    } catch (error) {
      toast.error('Failed to search Notion content')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSyncInsights = async () => {
    if (!integration.databases.insights) {
      toast.error('Insights database not configured')
      return
    }

    try {
      await syncData('insights', insights)
    } catch (error) {
      toast.error('Failed to sync insights')
    }
  }

  const handleCreateQuickNote = async () => {
    if (!isConnected) {
      toast.error('Not connected to Notion')
      return
    }

    const noteData = {
      title: `Quick Note - ${new Date().toLocaleDateString()}`,
      content: `Created from GalyarderOS by ${user?.email || 'Anonymous'}\n\nTimestamp: ${new Date().toISOString()}`
    }

    try {
      await createContent('notes', noteData)
      toast.success('Quick note created in Notion!')
    } catch (error) {
      toast.error('Failed to create note')
    }
  }

  const databaseTypes = [
    { id: 'goals', name: 'Goals', icon: Target, description: 'Track and manage your life goals' },
    { id: 'habits', name: 'Habits', icon: Zap, description: 'Monitor daily habits and routines' },
    { id: 'insights', name: 'AI Insights', icon: Brain, description: 'Store AI-generated life insights' },
    { id: 'reflections', name: 'Reflections', icon: Calendar, description: 'Daily and weekly reflection entries' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Notion Integration</h1>
              <p className="text-neural-300">Seamlessly sync your life optimization data with Notion</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${isConnected ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm text-neural-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Connection Status & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="neural-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Link className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Connection Status</h2>
          </div>

          {!isConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium mb-2">Not Connected</p>
                    <p className="text-neural-200 text-sm leading-relaxed">
                      Connect your Notion workspace to sync goals, habits, insights, and reflections automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-white">Setup Instructions:</h3>
                <ol className="space-y-2 text-sm text-neural-300">
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white font-bold mt-0.5">1</span>
                    <span>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Notion Integrations</a></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white font-bold mt-0.5">2</span>
                    <span>Create a new integration and copy the Internal Integration Token</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white font-bold mt-0.5">3</span>
                    <span>Add the token to your .env file as VITE_NOTION_TOKEN</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white font-bold mt-0.5">4</span>
                    <span>Share your databases with the integration</span>
                  </li>
                </ol>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectToNotion}
                disabled={isLoading}
                className="quantum-button w-full disabled:opacity-50"
              >
                {isLoading ? 'Connecting...' : 'Connect to Notion'}
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-300 font-medium mb-2">Successfully Connected</p>
                    <p className="text-neural-200 text-sm leading-relaxed">
                      Your Notion workspace is connected and ready for data synchronization.
                    </p>
                    {integration.lastSync && (
                      <p className="text-xs text-neural-400 mt-2">
                        Last sync: {integration.lastSync.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSyncInsights}
                  disabled={!integration.databases.insights || insights.length === 0}
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sync className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-sm font-medium text-white">Sync Insights</p>
                  <p className="text-xs text-neural-400">{insights.length} insights</p>
                </button>
                <button
                  onClick={handleCreateQuickNote}
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <Plus className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-sm font-medium text-white">Quick Note</p>
                  <p className="text-xs text-neural-400">Create instantly</p>
                </button>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <TestTube className="w-4 h-4" />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={disconnectFromNotion}
                  className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Disconnect
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Database Configuration */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="neural-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Database Configuration</h2>
          </div>

          <div className="space-y-4">
            {databaseTypes.map((dbType) => (
              <div key={dbType.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <dbType.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{dbType.name}</h3>
                      <p className="text-xs text-neural-400">{dbType.description}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    integration.databases[dbType.id as keyof typeof integration.databases] 
                      ? 'bg-green-400' 
                      : 'bg-gray-400'
                  }`}></div>
                </div>
                
                <input
                  type="text"
                  placeholder={`${dbType.name} Database ID`}
                  value={integration.databases[dbType.id as keyof typeof integration.databases] || ''}
                  onChange={(e) => updateSyncSettings({
                    databases: {
                      ...integration.databases,
                      [dbType.id]: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neural-400 
                             focus:outline-none focus:border-primary-500/50 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-blue-300 text-sm leading-relaxed">
              <strong>Tip:</strong> To get a database ID, open the database in Notion and copy the ID from the URL. 
              It's the string of characters between the last slash and the question mark.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Search & Content Management */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="neural-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Search className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Search Notion Content</h2>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search your Notion workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 
                           focus:outline-none focus:border-primary-500/50"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neural-400" />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="quantum-button disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </motion.button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Search Results ({searchResults.length}):</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">{result.title || 'Untitled'}</h4>
                        <p className="text-xs text-neural-400">
                          Last edited: {new Date(result.last_edited_time).toLocaleDateString()}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-neural-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Sync Status & History */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="neural-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl font-bold text-white">Sync Settings</h2>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${integration.syncEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-neural-400">
                {integration.syncEnabled ? 'Auto-sync enabled' : 'Auto-sync disabled'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-3">Sync Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neural-300">Last Sync</span>
                  <span className="text-white text-sm">
                    {integration.lastSync ? integration.lastSync.toLocaleString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neural-300">Auto Sync</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integration.syncEnabled}
                      onChange={(e) => updateSyncSettings({ syncEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-neural-300">Configured Databases</span>
                  <span className="text-white text-sm">
                    {Object.values(integration.databases).filter(Boolean).length} / {databaseTypes.length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    // Implement full sync
                    toast.info('Full sync feature coming soon!')
                  }}
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <Sync className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-sm font-medium text-white">Full Sync</p>
                  <p className="text-xs text-neural-400">Sync all data</p>
                </button>
                <button 
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left disabled:opacity-50"
                >
                  <Database className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-sm font-medium text-white">Test Connection</p>
                  <p className="text-xs text-neural-400">{isTesting ? 'Testing...' : 'Verify setup'}</p>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}