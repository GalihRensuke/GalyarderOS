import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Brain, 
  Heart, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Zap,
  Calendar
} from 'lucide-react'

interface LifeDomain {
  id: string
  name: string
  description: string
  score: number
  target: number
  trend: 'up' | 'down' | 'stable'
  color: string
  icon: React.ElementType
  metrics: DomainMetric[]
}

interface DomainMetric {
  name: string
  value: number
  unit: string
  target: number
  trend: 'up' | 'down' | 'stable'
}

export default function LifeBalance() {
  const [selectedDomain, setSelectedDomain] = useState<string>('physical')
  
  const [domains] = useState<LifeDomain[]>([
    {
      id: 'physical',
      name: 'Physical',
      description: 'Health, fitness, and physical well-being',
      score: 85,
      target: 90,
      trend: 'up',
      color: 'from-red-500 to-orange-500',
      icon: Activity,
      metrics: [
        { name: 'Workout Sessions', value: 4, unit: '/week', target: 5, trend: 'up' },
        { name: 'Sleep Quality', value: 8.2, unit: '/10', target: 8.5, trend: 'stable' },
        { name: 'Steps', value: 9500, unit: '/day', target: 10000, trend: 'up' },
        { name: 'Water Intake', value: 2.8, unit: 'L/day', target: 3.0, trend: 'down' },
      ]
    },
    {
      id: 'mental',
      name: 'Mental',
      description: 'Cognitive health, learning, and mental clarity',
      score: 92,
      target: 95,
      trend: 'up',
      color: 'from-blue-500 to-cyan-500',
      icon: Brain,
      metrics: [
        { name: 'Learning Hours', value: 12, unit: '/week', target: 15, trend: 'up' },
        { name: 'Meditation', value: 6, unit: 'days/week', target: 7, trend: 'stable' },
        { name: 'Focus Score', value: 8.7, unit: '/10', target: 9.0, trend: 'up' },
        { name: 'Stress Level', value: 3.2, unit: '/10', target: 2.5, trend: 'down' },
      ]
    },
    {
      id: 'spiritual',
      name: 'Spiritual',
      description: 'Purpose, values alignment, and inner peace',
      score: 78,
      target: 85,
      trend: 'stable',
      color: 'from-purple-500 to-pink-500',
      icon: Heart,
      metrics: [
        { name: 'Reflection Time', value: 20, unit: 'min/day', target: 30, trend: 'stable' },
        { name: 'Values Alignment', value: 8.5, unit: '/10', target: 9.0, trend: 'up' },
        { name: 'Gratitude Practice', value: 5, unit: 'days/week', target: 7, trend: 'down' },
        { name: 'Purpose Clarity', value: 8.8, unit: '/10', target: 9.2, trend: 'stable' },
      ]
    },
    {
      id: 'financial',
      name: 'Financial',
      description: 'Wealth building, financial security, and abundance',
      score: 88,
      target: 92,
      trend: 'up',
      color: 'from-green-500 to-emerald-500',
      icon: DollarSign,
      metrics: [
        { name: 'Savings Rate', value: 35, unit: '%', target: 40, trend: 'up' },
        { name: 'Investment Growth', value: 12.5, unit: '%/year', target: 15, trend: 'up' },
        { name: 'Income Streams', value: 3, unit: 'active', target: 5, trend: 'stable' },
        { name: 'Financial Score', value: 8.8, unit: '/10', target: 9.5, trend: 'up' },
      ]
    }
  ])

  const selectedDomainData = domains.find(d => d.id === selectedDomain)
  const overallScore = Math.round(domains.reduce((sum, domain) => sum + domain.score, 0) / domains.length)

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />
      default: return <Minus className="w-4 h-4 text-neutral-400" />
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
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Life Balance Matrix</h1>
              <p className="text-neural-300">Holistic optimization across all life domains</p>
            </div>
          </div>
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-neural-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 35}`}
                  strokeDashoffset={`${2 * Math.PI * 35 * (1 - overallScore / 100)}`}
                  className="text-primary-400 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{overallScore}</span>
              </div>
            </div>
            <p className="text-sm text-neural-400">Overall Balance</p>
          </div>
        </div>
      </motion.div>

      {/* Domain Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {domains.map((domain, index) => (
          <motion.div
            key={domain.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`neural-card cursor-pointer transition-all hover:scale-105 ${
              selectedDomain === domain.id ? 'ring-2 ring-primary-500/50' : ''
            }`}
            onClick={() => setSelectedDomain(domain.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${domain.color} rounded-xl flex items-center justify-center`}>
                <domain.icon className="w-6 h-6 text-white" />
              </div>
              {getTrendIcon(domain.trend)}
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">{domain.name}</h3>
            <p className="text-neural-400 text-sm mb-4">{domain.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neural-400">Score</span>
                <span className="text-lg font-bold text-white">{domain.score}/100</span>
              </div>
              <div className="w-full bg-neural-700 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${domain.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${domain.score}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neural-500">Target: {domain.target}</span>
                <span className={`font-medium ${
                  domain.score >= domain.target ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {domain.score >= domain.target ? 'On Track' : 'Needs Focus'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed View */}
      {selectedDomainData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Metrics */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="neural-card"
          >
            <div className="flex items-center space-x-3 mb-6">
              <selectedDomainData.icon className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-bold text-white">{selectedDomainData.name} Metrics</h2>
            </div>
            
            <div className="space-y-4">
              {selectedDomainData.metrics.map((metric, index) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white">{metric.name}</h3>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-white">
                      {metric.value}{metric.unit}
                    </span>
                    <span className="text-sm text-neural-400">
                      Target: {metric.target}{metric.unit}
                    </span>
                  </div>
                  <div className="w-full bg-neural-700 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${selectedDomainData.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* AI Insights & Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* AI Insights */}
            <div className="neural-card">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">AI Insights</h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                  <h3 className="font-semibold text-primary-300 mb-2">Optimization Opportunity</h3>
                  <p className="text-neural-200 text-sm leading-relaxed">
                    Your {selectedDomainData.name.toLowerCase()} domain is performing well, but there's room for improvement. 
                    Focus on the metrics that are below target to achieve better balance.
                  </p>
                </div>
                
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <h3 className="font-semibold text-green-300 mb-2">Strength Area</h3>
                  <p className="text-neural-200 text-sm leading-relaxed">
                    You're excelling in areas that align with your core values. This consistency is building strong foundations for long-term success.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="neural-card">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">Recommended Actions</h2>
              </div>
              
              <div className="space-y-3">
                {[
                  'Increase daily water intake by 200ml',
                  'Add 2 more workout sessions this week',
                  'Extend meditation practice by 5 minutes',
                  'Schedule weekly progress review'
                ].map((action, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                    <span className="text-neural-200 text-sm flex-1">{action}</span>
                    <Calendar className="w-4 h-4 text-neural-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Balance Radar */}
            <div className="neural-card">
              <h2 className="text-xl font-bold text-white mb-4">Balance Overview</h2>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-48 h-48" viewBox="0 0 200 200">
                  {/* Grid lines */}
                  {[1, 2, 3, 4, 5].map(i => (
                    <circle
                      key={i}
                      cx="100"
                      cy="100"
                      r={i * 16}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-neural-700"
                    />
                  ))}
                  
                  {/* Domain lines */}
                  {domains.map((domain, index) => {
                    const angle = (index * 90 - 90) * (Math.PI / 180)
                    const x = 100 + Math.cos(angle) * 80
                    const y = 100 + Math.sin(angle) * 80
                    return (
                      <line
                        key={domain.id}
                        x1="100"
                        y1="100"
                        x2={x}
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-neural-600"
                      />
                    )
                  })}
                  
                  {/* Score polygon */}
                  <polygon
                    points={domains.map((domain, index) => {
                      const angle = (index * 90 - 90) * (Math.PI / 180)
                      const radius = (domain.score / 100) * 80
                      const x = 100 + Math.cos(angle) * radius
                      const y = 100 + Math.sin(angle) * radius
                      return `${x},${y}`
                    }).join(' ')}
                    fill="rgba(14, 165, 233, 0.2)"
                    stroke="rgb(14, 165, 233)"
                    strokeWidth="2"
                  />
                  
                  {/* Score points */}
                  {domains.map((domain, index) => {
                    const angle = (index * 90 - 90) * (Math.PI / 180)
                    const radius = (domain.score / 100) * 80
                    const x = 100 + Math.cos(angle) * radius
                    const y = 100 + Math.sin(angle) * radius
                    return (
                      <circle
                        key={`${domain.id}-point`}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="rgb(14, 165, 233)"
                      />
                    )
                  })}
                </svg>
                
                {/* Labels */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <span className="text-xs text-neural-400">Mental</span>
                </div>
                <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2">
                  <span className="text-xs text-neural-400">Financial</span>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
                  <span className="text-xs text-neural-400">Spiritual</span>
                </div>
                <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2">
                  <span className="text-xs text-neural-400">Physical</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}