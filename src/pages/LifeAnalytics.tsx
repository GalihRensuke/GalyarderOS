import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calendar,
  Target,
  Zap,
  Heart,
  DollarSign,
  Users,
  Briefcase,
  Plus,
  Filter,
  Download,
  Settings
} from 'lucide-react'
import { lifeAnalyticsAPI } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface LifeMetric {
  id: string
  category: string
  name: string
  value: number
  unit: string
  target_value?: number
  measurement_type: string
  data_source: string
  recorded_at: string
}

export default function LifeAnalytics() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<LifeMetric[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [timeRange, setTimeRange] = useState('30d')
  const [showAddMetricModal, setShowAddMetricModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, selectedCategory, timeRange])

  const loadData = async () => {
    try {
      const [metricsResponse, overviewResponse] = await Promise.all([
        lifeAnalyticsAPI.getMetrics(1, 100, {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          date_from: getDateFromRange(timeRange)
        }),
        lifeAnalyticsAPI.getLifeOverview(timeRange)
      ])

      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data)
      }

      if (overviewResponse.success) {
        setOverview(overviewResponse.data)
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const getDateFromRange = (range: string) => {
    const date = new Date()
    switch (range) {
      case '7d':
        date.setDate(date.getDate() - 7)
        break
      case '30d':
        date.setDate(date.getDate() - 30)
        break
      case '90d':
        date.setDate(date.getDate() - 90)
        break
      default:
        date.setDate(date.getDate() - 30)
    }
    return date.toISOString()
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ElementType } = {
      'physical': Heart,
      'mental': Brain,
      'spiritual': Zap,
      'financial': DollarSign,
      'social': Users,
      'professional': Briefcase
    }
    return icons[category] || BarChart3
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'physical': 'from-red-500 to-orange-500',
      'mental': 'from-blue-500 to-cyan-500',
      'spiritual': 'from-purple-500 to-pink-500',
      'financial': 'from-green-500 to-emerald-500',
      'social': 'from-yellow-500 to-amber-500',
      'professional': 'from-indigo-500 to-blue-500'
    }
    return colors[category] || 'from-gray-500 to-slate-500'
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-400" />
    if (trend === 'declining') return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
    return <div className="w-4 h-4 bg-yellow-400 rounded-full" />
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="neural-card text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to access Life Analytics</h1>
          <p className="text-neural-300">Track and analyze your life metrics with AI-powered insights.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="neural-card text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neural-300">Loading your analytics...</p>
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
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Life Analytics</h1>
              <p className="text-neural-300">Comprehensive insights into your life optimization journey</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddMetricModal(true)}
              className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Metric</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="quantum-button"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Report
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neural-400" />
              <span className="text-sm text-neural-400">Filters:</span>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="all">All Categories</option>
              <option value="physical">Physical</option>
              <option value="mental">Mental</option>
              <option value="spiritual">Spiritual</option>
              <option value="financial">Financial</option>
              <option value="social">Social</option>
              <option value="professional">Professional</option>
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-neural-400" />
            <span className="text-sm text-neural-400">
              {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Overview Stats */}
      {overview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neural-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-bold text-white">Life Overview</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Total Metrics</h3>
              <p className="text-2xl font-bold text-blue-400">{overview.totalMetrics}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Categories Tracked</h3>
              <p className="text-2xl font-bold text-green-400">{Object.keys(overview.categories).length}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-medium text-white mb-2">Overall Trend</h3>
              <div className="flex items-center space-x-2">
                {getTrendIcon(overview.overallTrend)}
                <span className={`font-bold capitalize ${
                  overview.overallTrend === 'improving' ? 'text-green-400' :
                  overview.overallTrend === 'declining' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {overview.overallTrend}
                </span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(overview.categories).map(([category, data]: [string, any]) => {
              const CategoryIcon = getCategoryIcon(category)
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getCategoryColor(category)} rounded-lg flex items-center justify-center`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-medium text-white capitalize">{category}</h3>
                    </div>
                    {getTrendIcon(data.trend)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neural-400">Average:</span>
                      <span className="text-white font-medium">{data.average.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neural-400">Data Points:</span>
                      <span className="text-white font-medium">{data.count}</span>
                    </div>
                    {data.lastValue && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neural-400">Latest:</span>
                        <span className="text-white font-medium">{data.lastValue}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Top Performing Areas */}
          {(overview.topPerformingAreas.length > 0 || overview.areasNeedingAttention.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {overview.topPerformingAreas.length > 0 && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <h3 className="font-medium text-green-300 mb-3 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Top Performing Areas</span>
                  </h3>
                  <div className="space-y-2">
                    {overview.topPerformingAreas.map((area: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-200 capitalize">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overview.areasNeedingAttention.length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <h3 className="font-medium text-red-300 mb-3 flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Areas Needing Attention</span>
                  </h3>
                  <div className="space-y-2">
                    {overview.areasNeedingAttention.map((area: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="text-red-200 capitalize">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Metrics</h2>
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-neural-400" />
            <span className="text-sm text-neural-400">{metrics.length} data points</span>
          </div>
        </div>

        {metrics.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-neural-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No metrics yet</h3>
            <p className="text-neural-400 mb-6">Start tracking your life metrics to gain valuable insights</p>
            <button
              onClick={() => setShowAddMetricModal(true)}
              className="quantum-button"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Metric
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.slice(0, 10).map((metric, index) => {
              const CategoryIcon = getCategoryIcon(metric.category)
              return (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getCategoryColor(metric.category)} rounded-lg flex items-center justify-center`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{metric.name}</h3>
                        <p className="text-sm text-neural-400 capitalize">{metric.category} • {metric.measurement_type}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-neural-400">Value</p>
                        <p className="text-white font-medium">
                          {metric.value} {metric.unit}
                        </p>
                      </div>

                      {metric.target_value && (
                        <div className="text-right">
                          <p className="text-sm text-neural-400">Target</p>
                          <p className="text-white font-medium">
                            {metric.target_value} {metric.unit}
                          </p>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="text-sm text-neural-400">Source</p>
                        <p className="text-white font-medium capitalize">{metric.data_source}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-neural-400">Recorded</p>
                        <p className="text-white font-medium">
                          {new Date(metric.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {metric.target_value && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-neural-400 mb-1">
                        <span>Progress to Target</span>
                        <span>{Math.round((metric.value / metric.target_value) * 100)}%</span>
                      </div>
                      <div className="w-full bg-neural-700 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${getCategoryColor(metric.category)} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min((metric.value / metric.target_value) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Add Metric Modal */}
      {showAddMetricModal && (
        <AddMetricModal
          onClose={() => setShowAddMetricModal(false)}
          onSuccess={() => {
            setShowAddMetricModal(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

// Add Metric Modal Component
function AddMetricModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    category: 'physical',
    name: '',
    value: 0,
    unit: '',
    target_value: 0,
    measurement_type: 'gauge',
    data_source: 'manual'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.unit.trim()) return

    setIsSubmitting(true)
    try {
      const response = await lifeAnalyticsAPI.recordMetric(formData)
      if (response.success) {
        toast.success('Metric recorded successfully!')
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to record metric:', error)
      toast.error('Failed to record metric')
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
        className="neural-card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Add Life Metric</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
            >
              <option value="physical">Physical</option>
              <option value="mental">Mental</option>
              <option value="spiritual">Spiritual</option>
              <option value="financial">Financial</option>
              <option value="social">Social</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Metric Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
              placeholder="e.g., Weight, Mood, Sleep Hours"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Value</label>
              <input
                type="number"
                step="0.1"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
                placeholder="kg, hours, /10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Target Value (optional)</label>
            <input
              type="number"
              step="0.1"
              value={formData.target_value}
              onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseFloat(e.target.value) }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Type</label>
              <select
                value={formData.measurement_type}
                onChange={(e) => setFormData(prev => ({ ...prev, measurement_type: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              >
                <option value="gauge">Gauge</option>
                <option value="counter">Counter</option>
                <option value="timer">Timer</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Source</label>
              <select
                value={formData.data_source}
                onChange={(e) => setFormData(prev => ({ ...prev, data_source: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              >
                <option value="manual">Manual</option>
                <option value="automated">Automated</option>
                <option value="calculated">Calculated</option>
              </select>
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
              disabled={isSubmitting || !formData.name.trim() || !formData.unit.trim()}
              className="flex-1 quantum-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Recording...' : 'Record Metric'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}