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

// Mock data - in a real app this would come from the API
const mockRituals: Ritual[] = [
  {
    id: '1',
    name: 'Morning Meditation',
    description: 'Start the day with 20 minutes of mindfulness meditation',
    category: 'mindfulness',
    type: 'habit',
    frequency: 'daily',
    duration_minutes: 20,
    streak_count: 15,
    best_streak: 28,
    total_completions: 45,
    difficulty_level: 3,
    tags: ['meditation', 'mindfulness', 'morning'],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Evening Workout',
    description: 'High-intensity interval training session',
    category: 'health',
    type: 'routine',
    frequency: 'daily',
    duration_minutes: 45,
    streak_count: 8,
    best_streak: 21,
    total_completions: 32,
    difficulty_level: 4,
    tags: ['fitness', 'health', 'evening'],
    is_active: true,
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Weekly Planning',
    description: 'Review goals and plan the upcoming week',
    category: 'work',
    type: 'sequence',
    frequency: 'weekly',
    duration_minutes: 60,
    streak_count: 4,
    best_streak: 12,
    total_completions: 16,
    difficulty_level: 2,
    tags: ['planning', 'productivity', 'goals'],
    is_active: true,
    created_at: '2024-02-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Reading Session',
    description: 'Daily reading for personal development',
    category: 'learning',
    type: 'habit',
    frequency: 'daily',
    duration_minutes: 30,
    streak_count: 22,
    best_streak: 35,
    total_completions: 67,
    difficulty_level: 2,
    tags: ['reading', 'learning', 'development'],
    is_active: true,
    created_at: '2024-01-10T00:00:00Z'
  }
]

export default function RitualEngine() {
  const { user } = useAuth()
  const [rituals, setRituals] = useState<Ritual[]>(mockRituals)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRitual, setSelectedRitual] = useState<Ritual | null>(null)
  const [completingRitual, setCompletingRitual] = useState<string | null>(null)

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neural-card text-center py-12"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to access Ritual Engine</h1>
          <p className="text-neural-300">Track your habits and build powerful daily rituals.</p>
        </motion.div>
      </div>
    )
  }

  const handleCompleteRitual = async (ritualId: string) => {
    setCompletingRitual(ritualId)
    
    // Simulate API call
    setTimeout(() => {
      setRituals(prev => prev.map(ritual => 
        ritual.id === ritualId 
          ? { 
              ...ritual, 
              streak_count: ritual.streak_count + 1,
              total_completions: ritual.total_completions + 1,
              best_streak: Math.max(ritual.best_streak, ritual.streak_count + 1)
            }
          : ritual
      ))
      setCompletingRitual(null)
      toast.success('Ritual completed! 🎉')
    }, 1000)
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'morning': 'from-yellow-500 to-orange-500',
      'evening': 'from-purple-500 to-indigo-500',
      'work': 'from-blue-500 to-cyan-500',
      'health': 'from-green-500 to-emerald-500',
      'mindfulness': 'from-pink-500 to-rose-500',
      'learning': 'from-indigo-500 to-purple-500',
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

      {/* Create Ritual Modal */}
      {showCreateModal && (
        <CreateRitualModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newRitual) => {
            setRituals(prev => [...prev, newRitual])
            setShowCreateModal(false)
            toast.success('Ritual created successfully!')
          }}
        />
      )}

      {/* Ritual Detail Modal */}
      {selectedRitual && (
        <RitualDetailModal
          ritual={selectedRitual}
          onClose={() => setSelectedRitual(null)}
          onUpdate={(updatedRitual) => {
            setRituals(prev => prev.map(r => r.id === updatedRitual.id ? updatedRitual : r))
          }}
        />
      )}
    </div>
  )
}

// Create Ritual Modal Component
function CreateRitualModal({ onClose, onSuccess }: { 
  onClose: () => void, 
  onSuccess: (ritual: Ritual) => void 
}) {
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
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      const newRitual: Ritual = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        frequency: formData.frequency,
        duration_minutes: formData.duration_minutes,
        difficulty_level: formData.difficulty_level,
        tags: formData.tags,
        is_active: true,
        streak_count: 0,
        best_streak: 0,
        total_completions: 0,
        created_at: new Date().toISOString()
      }
      
      onSuccess(newRitual)
      setIsSubmitting(false)
    }, 1000)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
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
                <option value="learning">Learning</option>
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

          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Tags</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/10 text-neural-300 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-neural-400 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
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
  onUpdate: (ritual: Ritual) => void 
}) {
  const mockAnalytics = {
    totalCompletions: ritual.total_completions,
    averages: {
      moodBefore: 6.2,
      moodAfter: 7.8,
      energyBefore: 5.5,
      energyAfter: 7.2,
      duration: ritual.duration_minutes || 20
    },
    improvements: {
      moodImprovement: 1.6,
      energyImprovement: 1.7
    },
    consistency: 0.85
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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">30-Day Analytics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="font-medium text-white mb-2">Total Completions</h4>
                <p className="text-2xl font-bold text-green-400">{mockAnalytics.totalCompletions}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="font-medium text-white mb-2">Consistency</h4>
                <p className="text-2xl font-bold text-blue-400">{Math.round(mockAnalytics.consistency * 100)}%</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h4 className="font-medium text-white mb-3">Mood & Energy Impact</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neural-400">Mood Improvement:</span>
                  <span className="text-green-400">+{mockAnalytics.improvements.moodImprovement.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neural-400">Energy Improvement:</span>
                  <span className="text-green-400">+{mockAnalytics.improvements.energyImprovement.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}