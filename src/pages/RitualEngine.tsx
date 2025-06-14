import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Plus, 
  Calendar,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  Circle,
  Play,
  Pause,
  MoreVertical,
  Edit,
  Trash2,
  Award,
  Flame
} from 'lucide-react'
import { ritualEngineAPI } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface Ritual {
  id: string
  name: string
  description?: string
  category: string
  type: string
  frequency: string
  duration_minutes?: number
  streak_count: number
  best_streak: number
  total_completions: number
  difficulty_level: number
  tags: string[]
  is_active: boolean
  created_at: string
}

export default function RitualEngine() {
  const { user } = useAuth()
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRitual, setSelectedRitual] = useState<Ritual | null>(null)
  const [completingRitual, setCompletingRitual] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadRituals()
    }
  }, [user])

  const loadRituals = async () => {
    try {
      const response = await ritualEngineAPI.getRituals(1, 20)
      if (response.success && response.data) {
        setRituals(response.data)
      }
    } catch (error) {
      console.error('Failed to load rituals:', error)
      toast.error('Failed to load rituals')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRitual = async (ritualId: string) => {
    setCompletingRitual(ritualId)
    try {
      const completionData = {
        duration_minutes: 20,
        mood_before: 6,
        mood_after: 8,
        energy_before: 5,
        energy_after: 7,
        notes: 'Completed successfully',
        completed_steps: [],
        skipped_steps: []
      }

      const response = await ritualEngineAPI.completeRitual(ritualId, completionData)
      if (response.success) {
        toast.success('Ritual completed! 🎉')
        loadRituals() // Reload to update streak counts
      }
    } catch (error) {
      console.error('Failed to complete ritual:', error)
      toast.error('Failed to complete ritual')
    } finally {
      setCompletingRitual(null)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'morning': 'from-yellow-500 to-orange-500',
      'evening': 'from-purple-500 to-indigo-500',
      'work': 'from-blue-500 to-cyan-500',
      'health': 'from-green-500 to-emerald-500',
      'mindfulness': 'from-pink-500 to-rose-500',
      'custom': 'from-gray-500 to-slate-500'
    }
    return colors[category] || 'from-gray-500 to-slate-500'
  }

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-2 h-2 rounded-full ${
          i < level ? 'bg-yellow-400' : 'bg-gray-600'
        }`}
      />
    ))
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="neural-card text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to access Ritual Engine</h1>
          <p className="text-neural-300">Track your habits and build powerful daily rituals.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="neural-card text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neural-300">Loading your rituals...</p>
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
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Ritual Engine</h1>
              <p className="text-neural-300">Build powerful habits and daily rituals</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="quantum-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Ritual
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Active Rituals',
            value: rituals.filter(r => r.is_active).length,
            icon: Target,
            color: 'from-blue-500 to-cyan-500'
          },
          {
            label: 'Total Completions',
            value: rituals.reduce((sum, r) => sum + r.total_completions, 0),
            icon: CheckCircle,
            color: 'from-green-500 to-emerald-500'
          },
          {
            label: 'Best Streak',
            value: Math.max(...rituals.map(r => r.best_streak), 0),
            icon: Flame,
            color: 'from-orange-500 to-red-500'
          },
          {
            label: 'Avg Difficulty',
            value: rituals.length > 0 ? (rituals.reduce((sum, r) => sum + r.difficulty_level, 0) / rituals.length).toFixed(1) : '0',
            icon: Award,
            color: 'from-purple-500 to-pink-500'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="neural-card group hover:scale-105 transition-transform"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center group-hover:animate-pulse`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-neural-400">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rituals Grid */}
      {rituals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neural-card text-center py-12"
        >
          <Zap className="w-16 h-16 text-neural-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No rituals yet</h3>
          <p className="text-neural-400 mb-6">Create your first ritual to start building powerful habits</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="quantum-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Ritual
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rituals.map((ritual, index) => (
            <motion.div
              key={ritual.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="neural-card group hover:scale-105 transition-all cursor-pointer"
              onClick={() => setSelectedRitual(ritual)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getCategoryColor(ritual.category)} rounded-xl flex items-center justify-center`}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {getDifficultyStars(ritual.difficulty_level)}
                  </div>
                  <button className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                    <MoreVertical className="w-4 h-4 text-neural-400" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{ritual.name}</h3>
              {ritual.description && (
                <p className="text-neural-300 text-sm mb-4 line-clamp-2">{ritual.description}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neural-400">Current Streak</span>
                  <div className="flex items-center space-x-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-medium">{ritual.streak_count} days</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neural-400">Best Streak</span>
                  <span className="text-white font-medium">{ritual.best_streak} days</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neural-400">Completions</span>
                  <span className="text-white font-medium">{ritual.total_completions}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neural-400">Frequency</span>
                  <span className="text-white font-medium capitalize">{ritual.frequency}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {ritual.tags.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white/10 text-neural-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {ritual.tags.length > 2 && (
                      <span className="px-2 py-1 bg-white/10 text-neural-300 rounded-full text-xs">
                        +{ritual.tags.length - 2}
                      </span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCompleteRitual(ritual.id)
                    }}
                    disabled={completingRitual === ritual.id}
                    className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {completingRitual === ritual.id ? (
                      <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">Complete</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Ritual Modal */}
      {showCreateModal && (
        <CreateRitualModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadRituals()
          }}
        />
      )}

      {/* Ritual Detail Modal */}
      {selectedRitual && (
        <RitualDetailModal
          ritual={selectedRitual}
          onClose={() => setSelectedRitual(null)}
          onUpdate={loadRituals}
        />
      )}
    </div>
  )
}

// Create Ritual Modal Component
function CreateRitualModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'health',
    type: 'habit',
    frequency: 'daily',
    duration_minutes: 20,
    difficulty_level: 3,
    tags: [] as string[],
    reminder_enabled: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await ritualEngineAPI.createRitual(formData)
      if (response.success) {
        toast.success('Ritual created successfully!')
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create ritual:', error)
      toast.error('Failed to create ritual')
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
        <h2 className="text-2xl font-bold text-white mb-6">Create New Ritual</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
              placeholder="Morning Meditation"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50 resize-none"
              rows={3}
              placeholder="Daily meditation practice to start the day with clarity"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              >
                <option value="health">Health</option>
                <option value="mindfulness">Mindfulness</option>
                <option value="work">Work</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
                min="1"
                max="480"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Difficulty (1-5)</label>
              <input
                type="number"
                value={formData.difficulty_level}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
                min="1"
                max="5"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="reminder"
              checked={formData.reminder_enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, reminder_enabled: e.target.checked }))}
              className="w-4 h-4 text-primary-500 bg-white/5 border-white/10 rounded focus:ring-primary-500"
            />
            <label htmlFor="reminder" className="text-sm text-neural-300">Enable reminders</label>
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
              {isSubmitting ? 'Creating...' : 'Create Ritual'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Ritual Detail Modal Component
function RitualDetailModal({ ritual, onClose, onUpdate }: { 
  ritual: Ritual, 
  onClose: () => void, 
  onUpdate: () => void 
}) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [ritual.id])

  const loadAnalytics = async () => {
    try {
      const response = await ritualEngineAPI.getRitualAnalytics(ritual.id, '30d')
      if (response.success) {
        setAnalytics(response.data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoadingAnalytics(false)
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
        className="neural-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{ritual.name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {ritual.description && (
            <p className="text-neural-300">{ritual.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">Current Streak</h3>
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-2xl font-bold text-white">{ritual.streak_count}</span>
                <span className="text-neural-400">days</span>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-2">Best Streak</h3>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold text-white">{ritual.best_streak}</span>
                <span className="text-neural-400">days</span>
              </div>
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neural-400">Loading analytics...</p>
            </div>
          ) : analytics && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">30-Day Analytics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="font-medium text-white mb-2">Total Completions</h4>
                  <p className="text-2xl font-bold text-green-400">{analytics.totalCompletions}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="font-medium text-white mb-2">Consistency</h4>
                  <p className="text-2xl font-bold text-blue-400">{Math.round(analytics.consistency * 100)}%</p>
                </div>
              </div>

              {analytics.averages && (
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="font-medium text-white mb-3">Mood & Energy Impact</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neural-400">Mood Improvement:</span>
                      <span className="text-green-400">+{analytics.improvements.moodImprovement.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neural-400">Energy Improvement:</span>
                      <span className="text-green-400">+{analytics.improvements.energyImprovement.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}