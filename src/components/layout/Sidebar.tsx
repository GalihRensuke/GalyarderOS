import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Target, User, BarChart3, Zap, Focus, BookOpen, Carrot as Mirror, Activity, Command } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Command Center', href: '/command', icon: Command },
  { name: 'Identity Core', href: '/identity', icon: User },
  { name: 'Vision Architecture', href: '/vision', icon: Target },
  { name: 'Life Balance', href: '/balance', icon: Activity },
  { name: 'Ritual Engine', href: '/rituals', icon: Zap },
  { name: 'Flow State', href: '/flow', icon: Focus },
  { name: 'Knowledge Hub', href: '/knowledge', icon: BookOpen },
  { name: 'Reflection', href: '/reflection', icon: Mirror },
  { name: 'Life Analytics', href: '/analytics', icon: Brain },
  { name: 'Notion Sync', href: '/notion', icon: BookOpen },
]

export default function Sidebar() {
  return (
    <div className="w-64 glass-morphism border-r border-white/10 flex flex-col">
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold holographic-text">GalyarderOS</h1>
            <p className="text-xs text-neural-400">Digital Soul Layer</p>
          </div>
        </motion.div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'text-neural-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Neural AI</p>
            <p className="text-xs text-neural-400">Active & Learning</p>
          </div>
        </div>
      </div>
    </div>
  )
}