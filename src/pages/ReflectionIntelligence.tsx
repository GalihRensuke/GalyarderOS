import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Carrot as Mirror, 
  Plus, 
  Calendar,
  TrendingUp,
  Brain,
  Heart,
  Zap,
  Target,
  BookOpen,
  Lightbulb,
  Star,
  Clock,
  Filter
} from 'lucide-react'
import { reflectionIntelligenceAPI } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface ReflectionEntry {
  id: string
  title: string
  content: string
  type: string
  mood_score?: number
  energy_score?: number
  satisfaction_score?: number
  stress_level?: number
  key_insights: string[]
  action_items: string[]
  gratitude_items: string[]
  challenges_faced: string[]
  wins_celebrated: string[]
  tags: string[]
  created_at: string
}

export default function ReflectionIntelligence() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ReflectionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<ReflectionEntry | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [selectedType, setSelectedType] = useState('all')

  useEffect(() => {
    if (user) {
      loadEntries()
      loadAnalytics()
    }
  }, [user, selectedType])

  const loadEntries = async () => {
    try {
      const filters: any = {}
      if (selectedType !== 'all') filters.type = selectedType

      const response = await reflectionIntelligenceAPI.getReflectionEntries(1, 20, filters)
      if (response.success && response.data) {
        setEntries(response.data)
      }
    } catch (error) {
      console.error('Failed to load reflection entries:', error)
      toast.error('Failed to load reflections')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await reflectionIntelligenceAPI.getReflectionAnalytics('30d')
      if (response.success) {
        setAnalytics(response.data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'daily': 'from-blue-500 to-cyan-500',
      'weekly': 'from-green-500 to-emerald-500',
      'monthly': 'from-purple-500 to-pink-500',
      'spontaneous': 'from-orange-500 to-red-500'
    }
    return colors[type] || 'from-gray-500 to-slate-500'
  }

  const getMoodColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 8) return 'text-green-400'
    if (score >= 6) return 'text-yellow-400'
    if (score >= 4) return 'text-orange-400'
    return 'text-red-400'
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="neural-card text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to access Reflection Intelligence</h1>
          <p className="text-neural-300">Track your personal growth with AI-powered reflection insights.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="neural-card text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neural-300">Loading your reflections...</p>
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
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Mirror className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Reflection Intelligence</h1>
              <p className="text-neural-300">AI-powered journaling and personal growth insights</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="quantum-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Reflection
          </motion.button>
        </div>
      </motion.div>

      {/* Analytics Overview */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neural-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-bold text-white">30-Day Reflection Analytics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Total Entries</h3>
              <p className="text-2xl font-bold text-blue-400">{analytics.total_entries}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Consistency</h3>
              <p className="text-2xl font-bold text-green-400">{Math.round(analytics.consistency_score)}%</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Avg Mood</h3>
              <p className={`text-2xl font-bold ${getMoodColor(analytics.average_mood)}`}>
                {analytics.average_mood.toFixed(1)}/10
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Mood Trend</h3>
              <div className="flex items-center space-x-2">
                {analytics.mood_trend === 'improving' && <TrendingUp className="w-5 h-5 text-green-400" />}
                {analytics.mood_trend === 'declining' && <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />}
                {analytics.mood_trend === 'stable' && <div className="w-5 h-5 bg-yellow-400 rounded-full" />}
                <span className={`font-bold capitalize ${
                  analytics.mood_trend === 'improving' ? 'text-green-400' :
                  analytics.mood_trend === 'declining' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {analytics.mood_trend}
                </span>
              </div>
            </div>
          </div>

          {analytics.common_themes && analytics.common_themes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-white mb-3">Common Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {analytics.common_themes.slice(0, 8).map((theme: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-white mb-3">Growth Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {analytics.growth_areas.slice(0, 8).map((area: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neural-400" />
            <span className="text-sm text-neural-400">Filter by type:</span>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50"
          >
            <option value="all">All Types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="spontaneous">Spontaneous</option>
          </select>
        </div>
      </motion.div>

      {/* Reflection Entries */}
      {entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neural-card text-center py-12"
        >
          <Mirror className="w-16 h-16 text-neural-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No reflections yet</h3>
          <p className="text-neural-400 mb-6">Start your reflection journey to gain deeper insights into your personal growth</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="quantum-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Write Your First Reflection
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="neural-card group hover:scale-105 transition-all cursor-pointer"
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(entry.type)} rounded-xl flex items-center justify-center`}>
                  <Mirror className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-xs text-neural-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    entry.type === 'daily' ? 'bg-blue-500/20 text-blue-300' :
                    entry.type === 'weekly' ? 'bg-green-500/20 text-green-300' :
                    entry.type === 'monthly' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-orange-500/20 text-orange-300'
                  }`}>
                    {entry.type}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{entry.title}</h3>
              <p className="text-neural-300 text-sm mb-4 line-clamp-3">{entry.content}</p>

              <div className="space-y-3">
                {(entry.mood_score || entry.energy_score || entry.satisfaction_score) && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {entry.mood_score && (
                      <div className="text-center">
                        <Heart className="w-4 h-4 mx-auto mb-1 text-pink-400" />
                        <p className="text-neural-400">Mood</p>
                        <p className={`font-bold ${getMoodColor(entry.mood_score)}`}>{entry.mood_score}</p>
                      </div>
                    )}
                    {entry.energy_score && (
                      <div className="text-center">
                        <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                        <p className="text-neural-400">Energy</p>
                        <p className={`font-bold ${getMoodColor(entry.energy_score)}`}>{entry.energy_score}</p>
                      </div>
                    )}
                    {entry.satisfaction_score && (
                      <div className="text-center">
                        <Star className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                        <p className="text-neural-400">Satisfaction</p>
                        <p className={`font-bold ${getMoodColor(entry.satisfaction_score)}`}>{entry.satisfaction_score}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {entry.key_insights.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Lightbulb className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-neural-400">Insights ({entry.key_insights.length})</span>
                      </div>
                      <p className="text-xs text-neural-300 line-clamp-2">
                        {entry.key_insights[0]}
                      </p>
                    </div>
                  )}

                  {entry.action_items.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Target className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-neural-400">Actions ({entry.action_items.length})</span>
                      </div>
                      <p className="text-xs text-neural-300 line-clamp-2">
                        {entry.action_items[0]}
                      </p>
                    </div>
                  )}

                  {entry.wins_celebrated.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Star className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-neural-400">Wins ({entry.wins_celebrated.length})</span>
                      </div>
                      <p className="text-xs text-neural-300 line-clamp-2">
                        {entry.wins_celebrated[0]}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {entry.tags.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white/10 text-neural-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {entry.tags.length > 2 && (
                      <span className="px-2 py-1 bg-white/10 text-neural-300 rounded-full text-xs">
                        +{entry.tags.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-neural-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Reflection Modal */}
      {showCreateModal && (
        <CreateReflectionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadEntries()
            loadAnalytics()
          }}
        />
      )}

      {/* Reflection Detail Modal */}
      {selectedEntry && (
        <ReflectionDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdate={() => {
            loadEntries()
            loadAnalytics()
          }}
        />
      )}
    </div>
  )
}

// Create Reflection Modal Component
function CreateReflectionModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'daily',
    mood_score: 5,
    energy_score: 5,
    satisfaction_score: 5,
    stress_level: 5,
    key_insights: [] as string[],
    action_items: [] as string[],
    gratitude_items: [] as string[],
    challenges_faced: [] as string[],
    wins_celebrated: [] as string[],
    tags: [] as string[]
  })
  const [currentInsight, setCurrentInsight] = useState('')
  const [currentAction, setCurrentAction] = useState('')
  const [currentGratitude, setCurrentGratitude] = useState('')
  const [currentChallenge, setCurrentChallenge] = useState('')
  const [currentWin, setCurrentWin] = useState('')
  const [currentTag, setCurrentTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return

    setIsSubmitting(true)
    try {
      const response = await reflectionIntelligenceAPI.createReflectionEntry(formData)
      if (response.success) {
        toast.success('Reflection created successfully!')
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create reflection:', error)
      toast.error('Failed to create reflection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addItem = (type: string, value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type as keyof typeof prev] as string[], value.trim()]
      }))
      setter('')
    }
  }

  const removeItem = (type: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: (prev[type as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }))
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
        className="neural-card w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Create Reflection</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
                placeholder="Today's Reflection"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="spontaneous">Spontaneous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50 resize-none"
              rows={6}
              placeholder="Write your reflection here..."
              required
            />
          </div>

          {/* Mood Scores */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Mood & Energy</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'mood_score', label: 'Mood', icon: Heart, color: 'text-pink-400' },
                { key: 'energy_score', label: 'Energy', icon: Zap, color: 'text-yellow-400' },
                { key: 'satisfaction_score', label: 'Satisfaction', icon: Star, color: 'text-purple-400' },
                { key: 'stress_level', label: 'Stress', icon: Target, color: 'text-red-400' }
              ].map(({ key, label, icon: Icon, color }) => (
                <div key={key}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <label className="text-sm font-medium text-neural-300">{label}</label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData[key as keyof typeof formData] as number}
                    onChange={(e) => setFormData(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-neural-400 mt-1">
                    <span>1</span>
                    <span className="text-white font-medium">{formData[key as keyof typeof formData] as number}</span>
                    <span>10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'key_insights', label: 'Key Insights', current: currentInsight, setter: setCurrentInsight, icon: Lightbulb, color: 'text-yellow-400' },
              { key: 'action_items', label: 'Action Items', current: currentAction, setter: setCurrentAction, icon: Target, color: 'text-green-400' },
              { key: 'gratitude_items', label: 'Gratitude', current: currentGratitude, setter: setCurrentGratitude, icon: Heart, color: 'text-pink-400' },
              { key: 'challenges_faced', label: 'Challenges', current: currentChallenge, setter: setCurrentChallenge, icon: Target, color: 'text-red-400' },
              { key: 'wins_celebrated', label: 'Wins', current: currentWin, setter: setCurrentWin, icon: Star, color: 'text-purple-400' }
            ].map(({ key, label, current, setter, icon: Icon, color }) => (
              <div key={key}>
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <label className="text-sm font-medium text-neural-300">{label}</label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={current}
                    onChange={(e) => setter(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(key, current, setter))}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
                    placeholder={`Add ${label.toLowerCase()}`}
                  />
                  <button
                    type="button"
                    onClick={() => addItem(key, current, setter)}
                    className="px-3 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {(formData[key as keyof typeof formData] as string[]).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                      <span className="text-sm text-white">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(key, index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              className="flex-1 quantum-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Reflection'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Reflection Detail Modal Component
function ReflectionDetailModal({ entry, onClose, onUpdate }: { 
  entry: ReflectionEntry, 
  onClose: () => void, 
  onUpdate: () => void 
}) {
  const getMoodColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 8) return 'text-green-400'
    if (score >= 6) return 'text-yellow-400'
    if (score >= 4) return 'text-orange-400'
    return 'text-red-400'
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
        className="neural-card w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{entry.title}</h2>
            <p className="text-neural-400 capitalize">{entry.type} • {new Date(entry.created_at).toLocaleDateString()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Reflection Content</h3>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-neural-200 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
              </div>
            </div>

            {entry.key_insights.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <span>Key Insights</span>
                </h3>
                <div className="space-y-2">
                  {entry.key_insights.map((insight, index) => (
                    <div key={index} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-200">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.action_items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span>Action Items</span>
                </h3>
                <div className="space-y-2">
                  {entry.action_items.map((action, index) => (
                    <div key={index} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-200">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.wins_celebrated.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span>Wins Celebrated</span>
                </h3>
                <div className="space-y-2">
                  {entry.wins_celebrated.map((win, index) => (
                    <div key={index} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <p className="text-purple-200">{win}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.challenges_faced.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-red-400" />
                  <span>Challenges Faced</span>
                </h3>
                <div className="space-y-2">
                  {entry.challenges_faced.map((challenge, index) => (
                    <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-200">{challenge}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.gratitude_items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <span>Gratitude</span>
                </h3>
                <div className="space-y-2">
                  {entry.gratitude_items.map((gratitude, index) => (
                    <div key={index} className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                      <p className="text-pink-200">{gratitude}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-3">Mood & Energy Scores</h3>
              <div className="space-y-3">
                {[
                  { label: 'Mood', score: entry.mood_score, icon: Heart, color: 'text-pink-400' },
                  { label: 'Energy', score: entry.energy_score, icon: Zap, color: 'text-yellow-400' },
                  { label: 'Satisfaction', score: entry.satisfaction_score, icon: Star, color: 'text-purple-400' },
                  { label: 'Stress Level', score: entry.stress_level, icon: Target, color: 'text-red-400' }
                ].map(({ label, score, icon: Icon, color }) => (
                  score && (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-neural-400">{label}:</span>
                      </div>
                      <span className={`font-bold ${getMoodColor(score)}`}>{score}/10</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            {entry.tags.length > 0 && (
              <div className="p-4 bg-white/5 rounded-xl">
                <h3 className="font-semibold text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/10 text-neural-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-3">Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm">
                  Edit Reflection
                </button>
                <button className="w-full px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm">
                  Generate Insights
                </button>
                <button className="w-full px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                  Export to Notion
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}