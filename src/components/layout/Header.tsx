import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Bell, Settings, User, Mic, MicOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user, profile } = useAuth()
  const [isListening, setIsListening] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    // Voice input logic would go here
  }

  return (
    <header className="glass-morphism border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neural-400" />
            <input
              type="text"
              placeholder="Ask Neural AI anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2 bg-white/5 border border-white/10 rounded-xl 
                         text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50 
                         focus:bg-white/10 transition-all"
            />
            <button
              onClick={toggleVoiceInput}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors ${
                isListening 
                  ? 'text-red-400 bg-red-500/20' 
                  : 'text-neural-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-neural-300" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5 text-neural-300" />
          </motion.button>

          <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {profile?.full_name || user?.email?.split('@')[0] || 'Guest'}
              </p>
              <p className="text-xs text-neural-400">
                Level {profile?.level || 1} Optimizer
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}