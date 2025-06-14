import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Focus, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Target, 
  Zap,
  TrendingUp,
  Brain,
  Settings,
  Plus,
  Timer,
  BarChart3
} from 'lucide-react'
import { flowStateAPI } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface FlowSession {
  id: string
  name: string
  type: string
  planned_duration: number
  actual_duration?: number
  start_time: string
  end_time?: string
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
  focus_score?: number
  productivity_score?: number
  distraction_count: number
  environment_settings: any
  created_at: string
}

export default function FlowState() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<FlowSession[]>([])
  const [activeSession, setActiveSession] = useState<FlowSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    if (user) {
      loadSessions()
      loadAnalytics()
    }
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeSession && activeSession.status === 'active') {
      interval = setInterval(() => {
        const startTime = new Date(activeSession.start_time).getTime()
        const now = new Date().getTime()
        setTimer(Math.floor((now - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeSession])

  const loadSessions = async () => {
    try {
      const response = await flowStateAPI.getFlowSessions(1, 20)
      if (response.success && response.data) {
        setSessions(response.data)
        const active = response.data.find(s => s.status === 'active' || s.status === 'paused')
        setActiveSession(active || null)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
      toast.error('Failed to load flow sessions')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await flowStateAPI.getFlowAnalytics('30d')
      if (response.success) {
        setAnalytics(response.data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  const handleStartSession = async (sessionId: string) => {
    try {
      const response = await flowStateAPI.startFlowSession(sessionId)
      if (response.success) {
        toast.success('Flow session started! 🚀')
        loadSessions()
      }
    } catch (error) {
      console.error('Failed to start session:', error)
      toast.error('Failed to start session')
    }
  }

  const handlePauseSession = async (sessionId: string) => {
    try {
      const response = await flowStateAPI.pauseFlowSession(sessionId)
      if (response.success) {
        toast.success('Session paused')
        loadSessions()
      }
    } catch (error) {
      console.error('Failed to pause session:', error)
      toast.error('Failed to pause session')
    }
  }

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const completionData = {
        focus_score: 8,
        productivity_score: 9,
        notes: 'Great focus session!'
      }
      const response = await flowStateAPI.completeFlowSession(sessionId, completionData)
      if (response.success) {
        toast.success('Session completed! 🎉')
        loadSessions()
        loadAnalytics()
      }
    } catch (error) {
      console.error('Failed to complete session:', error)
      toast.error('Failed to complete session')
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'deep_work': 'from-blue-500 to-cyan-500',
      'creative': 'from-purple-500 to-pink-500',
      'learning': 'from-green-500 to-emerald-500',
      'problem_solving': 'from-orange-500 to-red-500',
      'custom': 'from-gray-500 to-slate-500'
    }
    return colors[type] || 'from-gray-500 to-slate-500'
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="neural-card text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to access Flow State</h1>
          <p className="text-neural-300">Track your focus sessions and optimize your productivity.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="neural-card text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neural-300">Loading your flow sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Focus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Flow State Command</h1>
              <p className="text-neural-300">Deep focus sessions with performance tracking</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="quantum-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Session
          </motion.button>
        </div>
      </motion.div>

      {/* Active Session */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neural-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Active Session</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeSession.status === 'active' ? 'bg-green-500/20 text-green-300' :
              activeSession.status === 'paused' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {activeSession.status}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">{activeSession.name}</h3>
              
              <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="text-6xl font-mono font-bold text-white mb-2">
                    {formatTime(timer)}
                  </div>
                  <div className="text-neural-400">
                    Target: {activeSession.planned_duration} minutes
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                {activeSession.status === 'planned' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStartSession(activeSession.id)}
                    className="px-6 py-3 bg-green-500/20 text-green-300 rounded-xl hover:bg-green-500/30 transition-colors flex items-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Session</span>
                  </motion.button>
                )}

                {activeSession.status === 'active' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePauseSession(activeSession.id)}
                      className="px-6 py-3 bg-yellow-500/20 text-yellow-300 rounded-xl hover:bg-yellow-500/30 transition-colors flex items-center space-x-2"
                    >
                      <Pause className="w-5 h-5" />
                      <span>Pause</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCompleteSession(activeSession.id)}
                      className="px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-colors flex items-center space-x-2"
                    >
                      <Square className="w-5 h-5" />
                      <span>Complete</span>
                    </motion.button>
                  </>
                )}

                {activeSession.status === 'paused' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStartSession(activeSession.id)}
                      className="px-6 py-3 bg-green-500/20 text-green-300 rounded-xl hover:bg-green-500/30 transition-colors flex items-center space-x-2"
                    >
                      <Play className="w-5 h-5" />
                      <span>Resume</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCompleteSession(activeSession.id)}
                      className="px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-colors flex items-center space-x-2"
                    >
                      <Square className="w-5 h-5" />
                      <span>Complete</span>
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="font-medium text-white mb-2">Session Type</h4>
                <p className="text-neural-300 capitalize">{activeSession.type.replace('_', ' ')}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="font-medium text-white mb-2">Distractions</h4>
                <p className="text-2xl font-bold text-orange-400">{activeSession.distraction_count}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="font-medium text-white mb-2">Environment</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neural-400">Noise:</span>
                    <span className="text-white capitalize">{activeSession.environment_settings.noise_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neural-400">Music:</span>
                    <span className="text-white">{activeSession.environment_settings.music_enabled ? 'On' : 'Off'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neural-400">Blocking:</span>
                    <span className="text-white">{activeSession.environment_settings.website_blocking_enabled ? 'On' : 'Off'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Analytics */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neural-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-bold text-white">30-Day Analytics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Total Sessions</h3>
              <p className="text-2xl font-bold text-blue-400">{analytics.totalSessions}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Focus Time</h3>
              <p className="text-2xl font-bold text-green-400">{Math.round(analytics.totalFocusTime / 60)}h</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Avg Focus Score</h3>
              <p className="text-2xl font-bold text-purple-400">{analytics.averageFocusScore.toFixed(1)}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Avg Session</h3>
              <p className="text-2xl font-bold text-orange-400">{Math.round(analytics.averageSessionLength)}m</p>
            </div>
          </div>

          {analytics.sessionsByType && (
            <div className="mt-6">
              <h3 className="font-medium text-white mb-4">Sessions by Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.sessionsByType).map(([type, count]) => (
                  <div key={type} className="p-3 bg-white/5 rounded-lg">
                    <p className="text-sm text-neural-400 capitalize">{type.replace('_', ' ')}</p>
                    <p className="text-lg font-bold text-white">{count as number}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <h2 className="text-xl font-bold text-white mb-6">Recent Sessions</h2>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Focus className="w-16 h-16 text-neural-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No sessions yet</h3>
            <p className="text-neural-400 mb-6">Create your first flow session to start tracking your focus</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="quantum-button"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.slice(0, 5).map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 bg-gradient-to-br ${getSessionTypeColor(session.type)} rounded-lg flex items-center justify-center`}>
                      <Focus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{session.name}</h3>
                      <p className="text-sm text-neural-400 capitalize">{session.type.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-neural-400">Duration</p>
                      <p className="text-white font-medium">
                        {session.actual_duration ? `${session.actual_duration}m` : `${session.planned_duration}m planned`}
                      </p>
                    </div>

                    {session.focus_score && (
                      <div className="text-right">
                        <p className="text-sm text-neural-400">Focus Score</p>
                        <p className="text-white font-medium">{session.focus_score}/10</p>
                      </div>
                    )}

                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      session.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                      session.status === 'active' ? 'bg-blue-500/20 text-blue-300' :
                      session.status === 'paused' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {session.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadSessions()
          }}
        />
      )}
    </div>
  )
}

// Create Session Modal Component
function CreateSessionModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'deep_work',
    planned_duration: 90,
    environment_settings: {
      noise_level: 'ambient',
      lighting: 'natural',
      temperature_preference: 'comfortable',
      music_enabled: false,
      music_type: '',
      notifications_blocked: true,
      website_blocking_enabled: true,
      blocked_websites: ['facebook.com', 'twitter.com', 'youtube.com']
    },
    tags: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    try {
      const sessionData = {
        ...formData,
        metrics: {
          focus_intervals: [],
          screen_time_distribution: {},
          app_usage: {}
        }
      }

      const response = await flowStateAPI.createFlowSession(sessionData)
      if (response.success) {
        toast.success('Flow session created successfully!')
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create session:', error)
      toast.error('Failed to create session')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="neural-card w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Create Flow Session</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Session Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
              placeholder="Deep Work Session"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              >
                <option value="deep_work">Deep Work</option>
                <option value="creative">Creative</option>
                <option value="learning">Learning</option>
                <option value="problem_solving">Problem Solving</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={formData.planned_duration}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_duration: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
                min="15"
                max="480"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-3">Environment Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neural-300 mb-2">Noise Level</label>
                <select
                  value={formData.environment_settings.noise_level}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    environment_settings: { ...prev.environment_settings, noise_level: e.target.value }
                  }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
                >
                  <option value="silent">Silent</option>
                  <option value="ambient">Ambient</option>
                  <option value="moderate">Moderate</option>
                  <option value="energetic">Energetic</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="music"
                  checked={formData.environment_settings.music_enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    environment_settings: { ...prev.environment_settings, music_enabled: e.target.checked }
                  }))}
                  className="w-4 h-4 text-primary-500 bg-white/5 border-white/10 rounded focus:ring-primary-500"
                />
                <label htmlFor="music" className="text-sm text-neural-300">Enable background music</label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={formData.environment_settings.notifications_blocked}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    environment_settings: { ...prev.environment_settings, notifications_blocked: e.target.checked }
                  }))}
                  className="w-4 h-4 text-primary-500 bg-white/5 border-white/10 rounded focus:ring-primary-500"
                />
                <label htmlFor="notifications" className="text-sm text-neural-300">Block notifications</label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="blocking"
                  checked={formData.environment_settings.website_blocking_enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    environment_settings: { ...prev.environment_settings, website_blocking_enabled: e.target.checked }
                  }))}
                  className="w-4 h-4 text-primary-500 bg-white/5 border-white/10 rounded focus:ring-primary-500"
                />
                <label htmlFor="blocking" className="text-sm text-neural-300">Enable website blocking</label>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 text-neural-300 rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 quantum-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}