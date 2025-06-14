import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Link as LinkIcon,
  FileText,
  Video,
  Headphones,
  Lightbulb,
  Quote,
  Star,
  Eye,
  Calendar,
  Tag,
  Network
} from 'lucide-react'
import toast from 'react-hot-toast'

interface KnowledgeNode {
  id: string
  title: string
  content: string
  type: string
  source?: string
  author?: string
  url?: string
  tags: string[]
  category: string
  importance_score: number
  access_count: number
  created_at: string
  last_accessed: string
}

// Mock data
const mockNodes: KnowledgeNode[] = [
  {
    id: '1',
    title: 'The Power of Atomic Habits',
    content: 'Small changes compound over time. The key insight is that habits are the compound interest of self-improvement. A 1% improvement every day leads to being 37 times better after a year.',
    type: 'note',
    source: 'Atomic Habits',
    author: 'James Clear',
    url: 'https://jamesclear.com/atomic-habits',
    tags: ['habits', 'productivity', 'self-improvement'],
    category: 'personal-development',
    importance_score: 9,
    access_count: 15,
    created_at: '2024-01-10T00:00:00Z',
    last_accessed: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Flow State Psychology',
    content: 'Flow is a mental state where a person is fully immersed in an activity with energized focus, full involvement, and enjoyment. Key conditions: clear goals, immediate feedback, balance between challenge and skill.',
    type: 'article',
    source: 'Flow: The Psychology of Optimal Experience',
    author: 'Mihaly Csikszentmihalyi',
    tags: ['flow', 'psychology', 'performance'],
    category: 'psychology',
    importance_score: 8,
    access_count: 12,
    created_at: '2024-01-08T00:00:00Z',
    last_accessed: '2024-01-14T15:20:00Z'
  },
  {
    id: '3',
    title: 'Deep Work Principles',
    content: 'Deep work is the ability to focus without distraction on cognitively demanding tasks. It produces high-value output and is becoming increasingly rare in our connected world.',
    type: 'book',
    source: 'Deep Work',
    author: 'Cal Newport',
    tags: ['focus', 'productivity', 'work'],
    category: 'productivity',
    importance_score: 9,
    access_count: 20,
    created_at: '2024-01-05T00:00:00Z',
    last_accessed: '2024-01-15T09:15:00Z'
  },
  {
    id: '4',
    title: 'Meditation Benefits',
    content: 'Regular meditation practice leads to structural changes in the brain, improved emotional regulation, reduced stress, and enhanced focus. Even 10 minutes daily can make a significant difference.',
    type: 'idea',
    tags: ['meditation', 'mindfulness', 'health'],
    category: 'health',
    importance_score: 7,
    access_count: 8,
    created_at: '2024-01-12T00:00:00Z',
    last_accessed: '2024-01-13T14:45:00Z'
  },
  {
    id: '5',
    title: 'Growth Mindset Quote',
    content: '"The view you adopt for yourself profoundly affects the way you lead your life. It can determine whether you become the person you want to be and whether you accomplish the things you value."',
    type: 'quote',
    author: 'Carol Dweck',
    source: 'Mindset',
    tags: ['mindset', 'growth', 'psychology'],
    category: 'psychology',
    importance_score: 6,
    access_count: 5,
    created_at: '2024-01-14T00:00:00Z',
    last_accessed: '2024-01-14T16:30:00Z'
  }
]

export default function KnowledgeHub() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>(mockNodes)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = searchQuery === '' || 
      node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = selectedType === 'all' || node.type === selectedType
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory
    
    return matchesSearch && matchesType && matchesCategory
  })

  const handleSearch = () => {
    // Search is handled by filteredNodes
  }

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ElementType } = {
      'note': FileText,
      'article': BookOpen,
      'book': BookOpen,
      'video': Video,
      'podcast': Headphones,
      'idea': Lightbulb,
      'quote': Quote
    }
    return icons[type] || FileText
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'note': 'from-blue-500 to-cyan-500',
      'article': 'from-green-500 to-emerald-500',
      'book': 'from-purple-500 to-pink-500',
      'video': 'from-red-500 to-orange-500',
      'podcast': 'from-yellow-500 to-amber-500',
      'idea': 'from-indigo-500 to-blue-500',
      'quote': 'from-gray-500 to-slate-500'
    }
    return colors[type] || 'from-gray-500 to-slate-500'
  }

  const getImportanceStars = (score: number) => {
    return Array.from({ length: 10 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < score ? 'text-yellow-400 fill-current' : 'text-gray-600'
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
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Knowledge Synthesis</h1>
              <p className="text-neural-300">AI-powered knowledge organization and connection</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="quantum-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Knowledge
          </motion.button>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neural-card"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neural-400" />
            <input
              type="text"
              placeholder="Search your knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="px-6 py-3 bg-primary-500/20 text-primary-300 rounded-xl hover:bg-primary-500/30 transition-colors"
          >
            Search
          </motion.button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neural-400" />
            <span className="text-sm text-neural-400">Filters:</span>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50"
          >
            <option value="all">All Types</option>
            <option value="note">Notes</option>
            <option value="article">Articles</option>
            <option value="book">Books</option>
            <option value="video">Videos</option>
            <option value="podcast">Podcasts</option>
            <option value="idea">Ideas</option>
            <option value="quote">Quotes</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50"
          >
            <option value="all">All Categories</option>
            <option value="personal-development">Personal Development</option>
            <option value="productivity">Productivity</option>
            <option value="psychology">Psychology</option>
            <option value="health">Health</option>
            <option value="technology">Technology</option>
            <option value="business">Business</option>
          </select>
        </div>
      </motion.div>

      {/* Knowledge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Nodes',
            value: nodes.length,
            icon: BookOpen,
            color: 'from-blue-500 to-cyan-500'
          },
          {
            label: 'Avg Importance',
            value: nodes.length > 0 ? (nodes.reduce((sum, n) => sum + n.importance_score, 0) / nodes.length).toFixed(1) : '0',
            icon: Star,
            color: 'from-yellow-500 to-orange-500'
          },
          {
            label: 'Total Views',
            value: nodes.reduce((sum, n) => sum + n.access_count, 0),
            icon: Eye,
            color: 'from-green-500 to-emerald-500'
          },
          {
            label: 'Categories',
            value: new Set(nodes.map(n => n.category)).size,
            icon: Tag,
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

      {/* Knowledge Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNodes.map((node, index) => {
          const TypeIcon = getTypeIcon(node.type)
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="neural-card group hover:scale-105 transition-all cursor-pointer"
              onClick={() => setSelectedNode(node)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(node.type)} rounded-xl flex items-center justify-center`}>
                  <TypeIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  {getImportanceStars(node.importance_score).slice(0, 5)}
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{node.title}</h3>
              <p className="text-neural-300 text-sm mb-4 line-clamp-3">{node.content}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neural-400">Type</span>
                  <span className="text-white capitalize">{node.type}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neural-400">Category</span>
                  <span className="text-white capitalize">{node.category.replace('-', ' ')}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neural-400">Views</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-neural-400" />
                    <span className="text-white">{node.access_count}</span>
                  </div>
                </div>

                {node.source && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neural-400">Source</span>
                    <span className="text-white truncate max-w-32">{node.source}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {node.tags.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white/10 text-neural-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {node.tags.length > 2 && (
                      <span className="px-2 py-1 bg-white/10 text-neural-300 rounded-full text-xs">
                        +{node.tags.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-neural-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(node.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {node.url && (
                <div className="mt-3">
                  <a
                    href={node.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 text-sm"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>View Source</span>
                  </a>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Create Knowledge Modal */}
      {showCreateModal && (
        <CreateKnowledgeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newNode) => {
            setNodes(prev => [...prev, newNode])
            setShowCreateModal(false)
            toast.success('Knowledge node created!')
          }}
        />
      )}

      {/* Knowledge Detail Modal */}
      {selectedNode && (
        <KnowledgeDetailModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={(updatedNode) => {
            setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n))
          }}
        />
      )}
    </div>
  )
}

// Create Knowledge Modal Component
function CreateKnowledgeModal({ onClose, onSuccess }: { 
  onClose: () => void, 
  onSuccess: (node: KnowledgeNode) => void 
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'note',
    source: '',
    author: '',
    url: '',
    category: 'personal-development',
    importance_score: 5,
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return

    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      const newNode: KnowledgeNode = {
        id: Date.now().toString(),
        title: formData.title,
        content: formData.content,
        type: formData.type,
        source: formData.source,
        author: formData.author,
        url: formData.url,
        category: formData.category,
        importance_score: formData.importance_score,
        tags: formData.tags,
        access_count: 0,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      }
      
      onSuccess(newNode)
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
        className="neural-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Add Knowledge</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
              placeholder="Enter a descriptive title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50 resize-none"
              rows={6}
              placeholder="Enter the main content, notes, or key insights"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              >
                <option value="note">Note</option>
                <option value="article">Article</option>
                <option value="book">Book</option>
                <option value="video">Video</option>
                <option value="podcast">Podcast</option>
                <option value="idea">Idea</option>
                <option value="quote">Quote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              >
                <option value="personal-development">Personal Development</option>
                <option value="productivity">Productivity</option>
                <option value="psychology">Psychology</option>
                <option value="health">Health</option>
                <option value="technology">Technology</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
                placeholder="Book, website, course, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neural-300 mb-2">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
                placeholder="Author or creator"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">URL (optional)</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neural-400 focus:outline-none focus:border-primary-500/50"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neural-300 mb-2">Importance (1-10)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.importance_score}
              onChange={(e) => setFormData(prev => ({ ...prev, importance_score: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neural-400 mt-1">
              <span>Low</span>
              <span className="text-white font-medium">{formData.importance_score}</span>
              <span>High</span>
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
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              className="flex-1 quantum-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Knowledge'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Knowledge Detail Modal Component
function KnowledgeDetailModal({ node, onClose, onUpdate }: { 
  node: KnowledgeNode, 
  onClose: () => void, 
  onUpdate: (node: KnowledgeNode) => void 
}) {
  const TypeIcon = getTypeIcon(node.type)

  // Mock related nodes
  const relatedNodes = [
    { id: '1', title: 'Related Concept 1', type: 'note' },
    { id: '2', title: 'Related Concept 2', type: 'article' }
  ]

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
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(node.type)} rounded-xl flex items-center justify-center`}>
              <TypeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{node.title}</h2>
              <p className="text-neural-400 capitalize">{node.type} • {node.category.replace('-', ' ')}</p>
            </div>
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
              <h3 className="text-lg font-semibold text-white mb-3">Content</h3>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-neural-200 leading-relaxed whitespace-pre-wrap">{node.content}</p>
              </div>
            </div>

            {node.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {node.tags.map((tag, index) => (
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

            {relatedNodes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Related Knowledge</h3>
                <div className="space-y-3">
                  {relatedNodes.map((relatedNode) => {
                    const RelatedIcon = getTypeIcon(relatedNode.type)
                    return (
                      <div key={relatedNode.id} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-gradient-to-br ${getTypeColor(relatedNode.type)} rounded-lg flex items-center justify-center`}>
                            <RelatedIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{relatedNode.title}</h4>
                            <p className="text-xs text-neural-400 capitalize">{relatedNode.type}</p>
                          </div>
                          <LinkIcon className="w-4 h-4 text-neural-400" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-3">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neural-400">Importance:</span>
                  <div className="flex items-center space-x-1">
                    {getImportanceStars(node.importance_score).slice(0, 5)}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-neural-400">Views:</span>
                  <span className="text-white">{node.access_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neural-400">Created:</span>
                  <span className="text-white">{new Date(node.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neural-400">Last Accessed:</span>
                  <span className="text-white">{new Date(node.last_accessed).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {(node.source || node.author) && (
              <div className="p-4 bg-white/5 rounded-xl">
                <h3 className="font-semibold text-white mb-3">Source Information</h3>
                <div className="space-y-2 text-sm">
                  {node.source && (
                    <div>
                      <span className="text-neural-400">Source:</span>
                      <p className="text-white">{node.source}</p>
                    </div>
                  )}
                  {node.author && (
                    <div>
                      <span className="text-neural-400">Author:</span>
                      <p className="text-white">{node.author}</p>
                    </div>
                  )}
                  {node.url && (
                    <div>
                      <a
                        href={node.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-primary-400 hover:text-primary-300"
                      >
                        <LinkIcon className="w-4 h-4" />
                        <span>View Original</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="font-semibold text-white mb-3">Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors text-sm">
                  Create Connection
                </button>
                <button className="w-full px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm">
                  Add to Cluster
                </button>
                <button className="w-full px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm">
                  Edit Knowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function getTypeIcon(type: string) {
  const icons: { [key: string]: React.ElementType } = {
    'note': FileText,
    'article': BookOpen,
    'book': BookOpen,
    'video': Video,
    'podcast': Headphones,
    'idea': Lightbulb,
    'quote': Quote
  }
  return icons[type] || FileText
}

function getTypeColor(type: string) {
  const colors: { [key: string]: string } = {
    'note': 'from-blue-500 to-cyan-500',
    'article': 'from-green-500 to-emerald-500',
    'book': 'from-purple-500 to-pink-500',
    'video': 'from-red-500 to-orange-500',
    'podcast': 'from-yellow-500 to-amber-500',
    'idea': 'from-indigo-500 to-blue-500',
    'quote': 'from-gray-500 to-slate-500'
  }
  return colors[type] || 'from-gray-500 to-slate-500'
}

function getImportanceStars(score: number) {
  return Array.from({ length: 10 }, (_, i) => (
    <Star
      key={i}
      className={`w-3 h-3 ${
        i < score ? 'text-yellow-400 fill-current' : 'text-gray-600'
      }`}
    />
  ))
}