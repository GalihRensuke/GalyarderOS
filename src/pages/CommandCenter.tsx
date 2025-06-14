import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Mic, 
  Send, 
  Sparkles, 
  Zap,
  Target,
  Activity,
  BookOpen,
  Settings
} from 'lucide-react'
import { useAI } from '@/contexts/AIContext'

export default function CommandCenter() {
  const { askAI, isProcessing, personality } = useAI()
  const [query, setQuery] = useState('')
  const [conversation, setConversation] = useState([
    {
      id: '1',
      type: 'ai' as const,
      message: "Hello! I'm Neural, your AI life optimization partner. I'm here to help you unlock your maximum potential across all areas of life. What would you like to work on today?",
      timestamp: new Date()
    }
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isProcessing) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: query,
      timestamp: new Date()
    }

    setConversation(prev => [...prev, userMessage])
    setQuery('')

    try {
      const response = await askAI(query)
      const aiMessage = {
        id: response.id,
        type: 'ai' as const,
        message: response.message,
        timestamp: response.timestamp
      }
      setConversation(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to get AI response:', error)
    }
  }

  const quickActions = [
    { label: 'Optimize my day', icon: Zap, prompt: 'Help me optimize my daily schedule for maximum productivity and well-being' },
    { label: 'Review my goals', icon: Target, prompt: 'Let\'s review my current goals and see how I can improve my progress' },
    { label: 'Check my balance', icon: Activity, prompt: 'Analyze my life balance across mental, physical, spiritual, and financial domains' },
    { label: 'Learn something new', icon: BookOpen, prompt: 'Suggest something valuable I should learn based on my goals and interests' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center animate-pulse-slow">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Command Center</h1>
              <p className="text-neural-300">Direct interface with your AI optimization partner</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{personality.name}</p>
              <p className="text-xs text-neural-400 capitalize">{personality.style.replace('-', ' ')}</p>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="neural-card"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setQuery(action.prompt)}
              className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group text-left"
            >
              <action.icon className="w-6 h-6 text-primary-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-white">{action.label}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Conversation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="neural-card"
      >
        <div className="h-96 overflow-y-auto space-y-4 mb-6">
          {conversation.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/10 text-neural-100 border border-white/10'
              }`}>
                {message.type === 'ai' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary-400" />
                    <span className="text-xs text-primary-400 font-medium">Neural AI</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.message}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
          
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-white/10 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                  <span className="text-xs text-primary-400 font-medium">Neural AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-neural-300">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Neural AI anything about optimizing your life..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 
                         focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all"
              disabled={isProcessing}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg text-neural-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!query.trim() || isProcessing}
            className="quantum-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </motion.div>

      {/* AI Personality Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="neural-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">AI Personality</h2>
          <Settings className="w-5 h-5 text-neural-400" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-white/5 rounded-lg">
            <p className="text-sm text-neural-400 mb-1">Style</p>
            <p className="text-white font-medium capitalize">{personality.style.replace('-', ' ')}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <p className="text-sm text-neural-400 mb-1">Communication</p>
            <p className="text-white font-medium capitalize">{personality.communicationStyle}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <p className="text-sm text-neural-400 mb-1">Adaptiveness</p>
            <p className="text-white font-medium">{Math.round(personality.adaptiveness * 100)}%</p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <p className="text-sm text-neural-400 mb-1">Expertise</p>
            <p className="text-white font-medium">{personality.expertise.length} domains</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}