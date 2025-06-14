import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Heart, 
  Compass, 
  Star, 
  Target,
  Brain,
  Edit3,
  Save,
  Plus
} from 'lucide-react'

interface CoreValue {
  id: string
  name: string
  description: string
  priority: number
}

interface PersonalityTrait {
  name: string
  score: number
  description: string
}

export default function IdentityCore() {
  const [isEditing, setIsEditing] = useState(false)
  const [coreValues, setCoreValues] = useState<CoreValue[]>([
    { id: '1', name: 'Freedom', description: 'Living life on my own terms', priority: 1 },
    { id: '2', name: 'Growth', description: 'Continuous learning and improvement', priority: 2 },
    { id: '3', name: 'Impact', description: 'Making a meaningful difference', priority: 3 },
    { id: '4', name: 'Authenticity', description: 'Being true to myself', priority: 4 },
  ])

  const [personalityTraits] = useState<PersonalityTrait[]>([
    { name: 'Openness', score: 85, description: 'Open to new experiences and ideas' },
    { name: 'Conscientiousness', score: 92, description: 'Organized and goal-oriented' },
    { name: 'Extraversion', score: 68, description: 'Energized by social interaction' },
    { name: 'Agreeableness', score: 76, description: 'Cooperative and trusting' },
    { name: 'Neuroticism', score: 23, description: 'Emotionally stable and resilient' },
  ])

  const [purpose, setPurpose] = useState("To help others unlock their potential while building systems that create lasting positive impact in the world.")
  const [vision, setVision] = useState("A world where everyone has access to the tools and knowledge needed to optimize their life and achieve their dreams.")

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
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Identity Core</h1>
              <p className="text-neural-300">Your fundamental values, purpose, and personality blueprint</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className="quantum-button"
          >
            {isEditing ? <Save className="w-5 h-5 mr-2" /> : <Edit3 className="w-5 h-5 mr-2" />}
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core Values */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="neural-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Heart className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Core Values</h2>
            </div>
            {isEditing && (
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Plus className="w-4 h-4 text-primary-400" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {value.priority}
                      </div>
                      <h3 className="font-semibold text-white">{value.name}</h3>
                    </div>
                    <p className="text-neural-300 text-sm">{value.description}</p>
                  </div>
                  {isEditing && (
                    <button className="opacity-0 group-hover:opacity-100 p-1 rounded text-neural-400 hover:text-white transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Purpose & Vision */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Purpose */}
          <div className="neural-card">
            <div className="flex items-center space-x-3 mb-4">
              <Compass className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Life Purpose</h2>
            </div>
            {isEditing ? (
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 
                           focus:outline-none focus:border-primary-500/50 resize-none"
                rows={4}
              />
            ) : (
              <p className="text-neural-200 leading-relaxed">{purpose}</p>
            )}
          </div>

          {/* Vision */}
          <div className="neural-card">
            <div className="flex items-center space-x-3 mb-4">
              <Star className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Life Vision</h2>
            </div>
            {isEditing ? (
              <textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 
                           focus:outline-none focus:border-primary-500/50 resize-none"
                rows={4}
              />
            ) : (
              <p className="text-neural-200 leading-relaxed">{vision}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Personality Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="neural-card"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Personality Analysis</h2>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Big Five Model</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {personalityTraits.map((trait, index) => (
            <motion.div
              key={trait.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-neural-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - trait.score / 100)}`}
                    className="text-primary-400 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{trait.score}</span>
                </div>
              </div>
              <h3 className="font-semibold text-white mb-2">{trait.name}</h3>
              <p className="text-xs text-neural-400 leading-relaxed">{trait.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Identity Alignment Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="neural-card"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Identity Alignment</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-400">89%</p>
            <p className="text-sm text-neural-400">Living authentically</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white/5 rounded-xl">
            <h3 className="font-semibold text-white mb-2">Values Alignment</h3>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-neural-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <span className="text-sm text-green-400 font-medium">92%</span>
            </div>
          </div>
          
          <div className="p-4 bg-white/5 rounded-xl">
            <h3 className="font-semibold text-white mb-2">Purpose Clarity</h3>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-neural-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
              <span className="text-sm text-blue-400 font-medium">88%</span>
            </div>
          </div>
          
          <div className="p-4 bg-white/5 rounded-xl">
            <h3 className="font-semibold text-white mb-2">Action Consistency</h3>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-neural-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-400 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <span className="text-sm text-purple-400 font-medium">85%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}