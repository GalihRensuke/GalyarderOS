import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Target, 
  Zap, 
  TrendingUp, 
  Calendar,
  Clock,
  Award,
  Activity
} from 'lucide-react'
import { useAI } from '@/contexts/AIContext'

interface DashboardMetric {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: React.ElementType
  color: string
}

export default function Dashboard() {
  const { insights, generateInsight, isProcessing } = useAI()
  const [metrics, setMetrics] = useState<DashboardMetric[]>([
    {
      label: 'Life Optimization Score',
      value: '87%',
      change: '+12%',
      trend: 'up',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Goals Progress',
      value: '73%',
      change: '+8%',
      trend: 'up',
      icon: Target,
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Energy Level',
      value: '92%',
      change: '+5%',
      trend: 'up',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      label: 'Productivity Score',
      value: '85%',
      change: '+15%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500'
    }
  ])

  useEffect(() => {
    // Generate initial insights
    const mockData = {
      recentActivity: 'High productivity sessions',
      completedGoals: 3,
      habitStreak: 12,
      energyLevels: [8, 9, 7, 8, 9]
    }
    
    generateInsight('overall-performance', mockData)
  }, [generateInsight])

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, <span className="holographic-text">Optimizer</span>
            </h1>
            <p className="text-neural-300">
              Your digital soul layer is active and learning. Ready to unlock your potential?
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-white">Day 127</p>
              <p className="text-sm text-neural-400">Transformation Journey</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center animate-pulse-slow">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="neural-card group hover:scale-105 transition-transform"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center group-hover:animate-pulse`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-400' : 
                metric.trend === 'down' ? 'text-red-400' : 'text-neutral-400'
              }`}>
                {metric.change}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-sm text-neural-400">{metric.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="neural-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Neural Insights</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-neural-400">AI Active</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white text-sm">{insight.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    insight.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                    insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {insight.priority}
                  </span>
                </div>
                <p className="text-neural-300 text-sm mb-3">{insight.message}</p>
                {insight.actionItems.length > 0 && (
                  <div className="space-y-1">
                    {insight.actionItems.slice(0, 2).map((action, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                        <span className="text-xs text-neural-400">{action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
            
            {isProcessing && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-neural-400">Neural AI is analyzing your patterns...</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="neural-card"
        >
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Start Flow Session', icon: Clock, color: 'from-blue-500 to-cyan-500' },
              { label: 'Log Achievement', icon: Award, color: 'from-green-500 to-emerald-500' },
              { label: 'Review Goals', icon: Target, color: 'from-purple-500 to-pink-500' },
              { label: 'Check Vitals', icon: Activity, color: 'from-red-500 to-orange-500' },
            ].map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:animate-pulse`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-white">{action.label}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Today's Schedule Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Today's Optimization Schedule</h2>
          <Calendar className="w-5 h-5 text-neural-400" />
        </div>
        
        <div className="space-y-3">
          {[
            { time: '09:00', title: 'Deep Work Session', type: 'focus', duration: '2h' },
            { time: '11:30', title: 'Goal Review & Planning', type: 'planning', duration: '30m' },
            { time: '14:00', title: 'Learning Session', type: 'growth', duration: '1h' },
            { time: '16:00', title: 'Reflection & Insights', type: 'reflection', duration: '20m' },
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
              <div className="text-primary-400 font-mono text-sm">{item.time}</div>
              <div className="flex-1">
                <p className="text-white font-medium">{item.title}</p>
                <p className="text-neural-400 text-sm">{item.duration}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                item.type === 'focus' ? 'bg-blue-500/20 text-blue-300' :
                item.type === 'planning' ? 'bg-green-500/20 text-green-300' :
                item.type === 'growth' ? 'bg-purple-500/20 text-purple-300' :
                'bg-yellow-500/20 text-yellow-300'
              }`}>
                {item.type}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}