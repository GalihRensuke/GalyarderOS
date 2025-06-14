import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Target, 
  Plus, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Circle,
  Flag,
  Zap,
  Clock,
  Star
} from 'lucide-react'

interface Goal {
  id: string
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  progress: number
  target: number
  unit: string
  deadline: string
  status: 'active' | 'completed' | 'paused'
  milestones: Milestone[]
}

interface Milestone {
  id: string
  title: string
  completed: boolean
  dueDate: string
}

export default function VisionArchitecture() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Launch SaaS Product',
      description: 'Build and launch a profitable SaaS product that helps entrepreneurs',
      category: 'Business',
      priority: 'high',
      progress: 65,
      target: 100,
      unit: '%',
      deadline: '2024-06-30',
      status: 'active',
      milestones: [
        { id: '1', title: 'Complete MVP', completed: true, dueDate: '2024-02-15' },
        { id: '2', title: 'Beta Testing', completed: true, dueDate: '2024-03-30' },
        { id: '3', title: 'Marketing Campaign', completed: false, dueDate: '2024-05-15' },
        { id: '4', title: 'Official Launch', completed: false, dueDate: '2024-06-30' },
      ]
    },
    {
      id: '2',
      title: 'Master Machine Learning',
      description: 'Become proficient in ML algorithms and deep learning frameworks',
      category: 'Learning',
      priority: 'high',
      progress: 45,
      target: 100,
      unit: '%',
      deadline: '2024-12-31',
      status: 'active',
      milestones: [
        { id: '1', title: 'Complete Python Fundamentals', completed: true, dueDate: '2024-01-31' },
        { id: '2', title: 'Finish ML Course', completed: false, dueDate: '2024-04-30' },
        { id: '3', title: 'Build 3 ML Projects', completed: false, dueDate: '2024-08-31' },
        { id: '4', title: 'Get ML Certification', completed: false, dueDate: '2024-12-31' },
      ]
    },
    {
      id: '3',
      title: 'Achieve Financial Freedom',
      description: 'Build multiple income streams and achieve $10k monthly passive income',
      category: 'Financial',
      priority: 'high',
      progress: 30,
      target: 10000,
      unit: '$',
      deadline: '2025-12-31',
      status: 'active',
      milestones: [
        { id: '1', title: 'Emergency Fund ($50k)', completed: false, dueDate: '2024-06-30' },
        { id: '2', title: 'Investment Portfolio ($100k)', completed: false, dueDate: '2024-12-31' },
        { id: '3', title: 'First Passive Income Stream', completed: false, dueDate: '2025-03-31' },
        { id: '4', title: 'Reach $10k Monthly Passive', completed: false, dueDate: '2025-12-31' },
      ]
    }
  ])

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-orange-500'
      case 'medium': return 'from-yellow-500 to-amber-500'
      case 'low': return 'from-green-500 to-emerald-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Business': return 'text-blue-400'
      case 'Learning': return 'text-purple-400'
      case 'Financial': return 'text-green-400'
      case 'Health': return 'text-red-400'
      case 'Personal': return 'text-yellow-400'
      default: return 'text-neutral-400'
    }
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
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Vision Architecture</h1>
              <p className="text-neural-300">Strategic goal management with AI-powered optimization</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="quantum-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Goal
          </motion.button>
        </div>
      </motion.div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="neural-card"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">73%</p>
              <p className="text-sm text-neural-400">Average Progress</p>
            </div>
          </div>
          <div className="w-full bg-neural-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full" style={{ width: '73%' }}></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="neural-card"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{goals.filter(g => g.status === 'active').length}</p>
              <p className="text-sm text-neural-400">Active Goals</p>
            </div>
          </div>
          <p className="text-xs text-neural-500">2 high priority, 1 medium</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="neural-card"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">+15%</p>
              <p className="text-sm text-neural-400">This Month</p>
            </div>
          </div>
          <p className="text-xs text-neural-500">Above target pace</p>
        </motion.div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="neural-card cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => setSelectedGoal(goal)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{goal.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)} bg-white/10`}>
                      {goal.category}
                    </span>
                  </div>
                  <p className="text-neural-300 text-sm mb-3">{goal.description}</p>
                </div>
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getPriorityColor(goal.priority)}`}></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neural-400">Progress</span>
                  <span className="text-sm font-medium text-white">
                    {goal.progress}{goal.unit} / {goal.target}{goal.unit}
                  </span>
                </div>
                <div className="w-full bg-neural-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-neural-400" />
                    <span className="text-neural-400">Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-neural-400" />
                    <span className="text-neural-400">
                      {Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Goal Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="neural-card"
        >
          {selectedGoal ? (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-12 h-12 bg-gradient-to-br ${getPriorityColor(selectedGoal.priority)} rounded-xl flex items-center justify-center`}>
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedGoal.title}</h2>
                  <p className="text-neural-400 text-sm">{selectedGoal.category} • {selectedGoal.priority} priority</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Milestones</h3>
                  <div className="space-y-3">
                    {selectedGoal.milestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        {milestone.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-neural-400" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${milestone.completed ? 'text-green-300 line-through' : 'text-white'}`}>
                            {milestone.title}
                          </p>
                          <p className="text-xs text-neural-400">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">AI Insights</h3>
                  <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <Zap className="w-5 h-5 text-primary-400 mt-0.5" />
                      <div>
                        <p className="text-primary-300 font-medium mb-2">Optimization Suggestion</p>
                        <p className="text-neural-200 text-sm leading-relaxed">
                          Based on your current progress rate, you're on track to complete this goal 2 weeks ahead of schedule. 
                          Consider allocating some resources to accelerate your ML learning goal, which is slightly behind pace.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left">
                      <Star className="w-5 h-5 text-yellow-400 mb-2" />
                      <p className="text-sm font-medium text-white">Update Progress</p>
                    </button>
                    <button className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left">
                      <Calendar className="w-5 h-5 text-blue-400 mb-2" />
                      <p className="text-sm font-medium text-white">Schedule Review</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-neural-600 mx-auto mb-4" />
              <p className="text-neural-400">Select a goal to view details and AI insights</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}