// Knowledge Synthesis API Service

import { AuthenticatedAPIService } from './base'
import type { 
  KnowledgeNode, 
  KnowledgeConnection, 
  KnowledgeCluster,
  SearchResult,
  APIResponse,
  PaginatedResponse 
} from '@/types/backend'
import { supabase } from '@/lib/supabase'

export class KnowledgeSynthesisAPI extends AuthenticatedAPIService {
  constructor() {
    super('knowledge_nodes')
  }

  // Knowledge Node Management
  async createKnowledgeNode(nodeData: Omit<KnowledgeNode, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_accessed' | 'access_count'>): Promise<APIResponse<KnowledgeNode>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      this.validateRequired(nodeData, ['title', 'content', 'type'])
      
      if (nodeData.url && !this.validateUrl(nodeData.url)) {
        throw new Error('Invalid URL format')
      }

      const node = {
        ...nodeData,
        user_id: userId,
        title: this.sanitizeInput(nodeData.title),
        content: this.sanitizeInput(nodeData.content),
        source: nodeData.source ? this.sanitizeInput(nodeData.source) : null,
        author: nodeData.author ? this.sanitizeInput(nodeData.author) : null,
        connections: [],
        access_count: 0,
        last_accessed: new Date().toISOString()
      }

      const result = await supabase.from('knowledge_nodes').insert(node).select().single()
      
      // Auto-generate connections based on content similarity
      if (result.data) {
        await this.generateAutoConnections(result.data.id, result.data.content, result.data.tags)
      }

      return result
    })
  }

  async getKnowledgeNodes(page: number = 1, limit: number = 20, filters?: any): Promise<PaginatedResponse<KnowledgeNode>> {
    return this.handlePaginatedRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      let query = supabase
        .from('knowledge_nodes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }

      if (filters?.importance_min) {
        query = query.gte('importance_score', filters.importance_min)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      
      return await query.range(from, to)
    }, page, limit)
  }

  async getKnowledgeNode(id: string): Promise<APIResponse<KnowledgeNode>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      // Update access count and last accessed time
      await supabase.rpc('increment_node_access', { node_id: id })

      return await supabase
        .from('knowledge_nodes')
        .select(`
          *,
          connections:knowledge_connections!source_node_id(*),
          incoming_connections:knowledge_connections!target_node_id(*)
        `)
        .eq('id', id)
        .single()
    })
  }

  async updateKnowledgeNode(id: string, updates: Partial<KnowledgeNode>): Promise<APIResponse<KnowledgeNode>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      if (updates.url && !this.validateUrl(updates.url)) {
        throw new Error('Invalid URL format')
      }

      const sanitizedUpdates = {
        ...updates,
        title: updates.title ? this.sanitizeInput(updates.title) : undefined,
        content: updates.content ? this.sanitizeInput(updates.content) : undefined,
        source: updates.source ? this.sanitizeInput(updates.source) : undefined,
        author: updates.author ? this.sanitizeInput(updates.author) : undefined,
        updated_at: new Date().toISOString()
      }

      const result = await supabase
        .from('knowledge_nodes')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single()

      // Regenerate connections if content or tags changed
      if (updates.content || updates.tags) {
        await this.generateAutoConnections(id, updates.content || '', updates.tags || [])
      }

      return result
    })
  }

  async deleteKnowledgeNode(id: string): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      // Delete all connections involving this node
      await supabase
        .from('knowledge_connections')
        .delete()
        .or(`source_node_id.eq.${id},target_node_id.eq.${id}`)

      return await supabase.from('knowledge_nodes').delete().eq('id', id)
    })
  }

  // Knowledge Connections
  async createConnection(connectionData: Omit<KnowledgeConnection, 'id' | 'user_id' | 'created_at'>): Promise<APIResponse<KnowledgeConnection>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      this.validateRequired(connectionData, ['source_node_id', 'target_node_id', 'connection_type'])
      
      // Verify user owns both nodes
      const [sourceCheck, targetCheck] = await Promise.all([
        this.checkPermission(connectionData.source_node_id, userId),
        this.checkPermission(connectionData.target_node_id, userId)
      ])

      if (!sourceCheck || !targetCheck) {
        throw new Error('Access denied')
      }

      if (connectionData.source_node_id === connectionData.target_node_id) {
        throw new Error('Cannot connect a node to itself')
      }

      const connection = {
        ...connectionData,
        user_id: userId,
        description: connectionData.description ? this.sanitizeInput(connectionData.description) : null,
        strength: Math.max(0, Math.min(1, connectionData.strength || 0.5))
      }

      const result = await supabase.from('knowledge_connections').insert(connection).select().single()

      // Update connection arrays in both nodes
      await this.updateNodeConnections(connectionData.source_node_id, connectionData.target_node_id)

      return result
    })
  }

  async getConnections(nodeId: string): Promise<APIResponse<KnowledgeConnection[]>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(nodeId, userId)) {
        throw new Error('Access denied')
      }

      return await supabase
        .from('knowledge_connections')
        .select(`
          *,
          source_node:knowledge_nodes!source_node_id(id, title, type),
          target_node:knowledge_nodes!target_node_id(id, title, type)
        `)
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`)
        .order('strength', { ascending: false })
    })
  }

  async updateConnection(connectionId: string, updates: Partial<KnowledgeConnection>): Promise<APIResponse<KnowledgeConnection>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      const { data: connection } = await supabase
        .from('knowledge_connections')
        .select('user_id')
        .eq('id', connectionId)
        .single()

      if (!connection || connection.user_id !== userId) {
        throw new Error('Access denied')
      }

      const sanitizedUpdates = {
        ...updates,
        description: updates.description ? this.sanitizeInput(updates.description) : undefined,
        strength: updates.strength ? Math.max(0, Math.min(1, updates.strength)) : undefined
      }

      return await supabase
        .from('knowledge_connections')
        .update(sanitizedUpdates)
        .eq('id', connectionId)
        .select()
        .single()
    })
  }

  async deleteConnection(connectionId: string): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      const { data: connection } = await supabase
        .from('knowledge_connections')
        .select('*')
        .eq('id', connectionId)
        .single()

      if (!connection || connection.user_id !== userId) {
        throw new Error('Access denied')
      }

      const result = await supabase.from('knowledge_connections').delete().eq('id', connectionId)

      // Update connection arrays in both nodes
      await this.updateNodeConnections(connection.source_node_id, connection.target_node_id, true)

      return result
    })
  }

  // Knowledge Clusters
  async createCluster(clusterData: Omit<KnowledgeCluster, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<APIResponse<KnowledgeCluster>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      this.validateRequired(clusterData, ['name', 'node_ids', 'center_node_id'])
      
      // Verify user owns all nodes
      for (const nodeId of clusterData.node_ids) {
        if (!await this.checkPermission(nodeId, userId)) {
          throw new Error('Access denied to one or more nodes')
        }
      }

      const cluster = {
        ...clusterData,
        user_id: userId,
        name: this.sanitizeInput(clusterData.name),
        description: clusterData.description ? this.sanitizeInput(clusterData.description) : null,
        coherence_score: await this.calculateClusterCoherence(clusterData.node_ids)
      }

      return await supabase.from('knowledge_clusters').insert(cluster).select().single()
    })
  }

  async getClusters(): Promise<APIResponse<KnowledgeCluster[]>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()

      return await supabase
        .from('knowledge_clusters')
        .select(`
          *,
          nodes:knowledge_nodes!inner(id, title, type)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
    })
  }

  // Search and Discovery
  async searchKnowledge(query: string, options?: {
    types?: string[]
    categories?: string[]
    tags?: string[]
    limit?: number
  }): Promise<APIResponse<SearchResult[]>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!query.trim()) {
        throw new Error('Search query is required')
      }

      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)
      
      let dbQuery = supabase
        .from('knowledge_nodes')
        .select('*')
        .eq('user_id', userId)

      // Apply filters
      if (options?.types && options.types.length > 0) {
        dbQuery = dbQuery.in('type', options.types)
      }

      if (options?.categories && options.categories.length > 0) {
        dbQuery = dbQuery.in('category', options.categories)
      }

      if (options?.tags && options.tags.length > 0) {
        dbQuery = dbQuery.overlaps('tags', options.tags)
      }

      // Full-text search
      const searchPattern = searchTerms.join(' | ')
      dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`)

      const { data: nodes } = await dbQuery.limit(options?.limit || 50)

      if (!nodes) return { data: [] }

      // Calculate relevance scores and create search results
      const results: SearchResult[] = nodes.map(node => {
        const relevanceScore = this.calculateRelevanceScore(node, searchTerms)
        const snippet = this.generateSnippet(node.content, searchTerms)
        const highlightedTerms = this.findHighlightedTerms(node, searchTerms)

        return {
          node,
          relevance_score: relevanceScore,
          snippet,
          highlighted_terms: highlightedTerms
        }
      })

      // Sort by relevance score
      results.sort((a, b) => b.relevance_score - a.relevance_score)

      return { data: results }
    })
  }

  async getRelatedNodes(nodeId: string, limit: number = 10): Promise<APIResponse<KnowledgeNode[]>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(nodeId, userId)) {
        throw new Error('Access denied')
      }

      // Get directly connected nodes
      const { data: connections } = await supabase
        .from('knowledge_connections')
        .select(`
          strength,
          source_node:knowledge_nodes!source_node_id(*),
          target_node:knowledge_nodes!target_node_id(*)
        `)
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`)
        .order('strength', { ascending: false })
        .limit(limit)

      if (!connections) return { data: [] }

      const relatedNodes = connections.map(conn => {
        const relatedNode = conn.source_node.id === nodeId ? conn.target_node : conn.source_node
        return {
          ...relatedNode,
          connection_strength: conn.strength
        }
      })

      return { data: relatedNodes }
    })
  }

  // Auto-generation and AI features
  private async generateAutoConnections(nodeId: string, content: string, tags: string[]): Promise<void> {
    const userId = await this.ensureAuthenticated()
    
    // Find similar nodes based on content and tags
    const { data: similarNodes } = await supabase
      .from('knowledge_nodes')
      .select('id, title, content, tags, importance_score')
      .eq('user_id', userId)
      .neq('id', nodeId)

    if (!similarNodes) return

    for (const similarNode of similarNodes) {
      const similarity = this.calculateContentSimilarity(content, similarNode.content, tags, similarNode.tags)
      
      if (similarity > 0.3) { // Threshold for auto-connection
        const connectionType = this.determineConnectionType(content, similarNode.content)
        
        await supabase.from('knowledge_connections').insert({
          user_id: userId,
          source_node_id: nodeId,
          target_node_id: similarNode.id,
          connection_type: connectionType,
          strength: similarity,
          description: `Auto-generated based on content similarity (${Math.round(similarity * 100)}%)`
        })
      }
    }
  }

  private calculateContentSimilarity(content1: string, content2: string, tags1: string[], tags2: string[]): number {
    // Simple similarity calculation based on common words and tags
    const words1 = new Set(content1.toLowerCase().split(/\W+/).filter(w => w.length > 3))
    const words2 = new Set(content2.toLowerCase().split(/\W+/).filter(w => w.length > 3))
    
    const commonWords = new Set([...words1].filter(w => words2.has(w)))
    const wordSimilarity = commonWords.size / Math.max(words1.size, words2.size)
    
    const commonTags = tags1.filter(tag => tags2.includes(tag))
    const tagSimilarity = commonTags.length / Math.max(tags1.length, tags2.length, 1)
    
    return (wordSimilarity * 0.7) + (tagSimilarity * 0.3)
  }

  private determineConnectionType(content1: string, content2: string): string {
    // Simple heuristics to determine connection type
    const content1Lower = content1.toLowerCase()
    const content2Lower = content2.toLowerCase()
    
    if (content1Lower.includes('however') || content1Lower.includes('but') || 
        content2Lower.includes('however') || content2Lower.includes('but')) {
      return 'contradicts'
    }
    
    if (content1Lower.includes('supports') || content1Lower.includes('confirms') ||
        content2Lower.includes('supports') || content2Lower.includes('confirms')) {
      return 'supports'
    }
    
    if (content1Lower.includes('example') || content2Lower.includes('example')) {
      return 'example_of'
    }
    
    if (content1Lower.includes('builds on') || content2Lower.includes('builds on')) {
      return 'builds_on'
    }
    
    return 'related'
  }

  private async updateNodeConnections(sourceNodeId: string, targetNodeId: string, isDelete: boolean = false): Promise<void> {
    if (isDelete) {
      // Remove from connection arrays
      await supabase.rpc('remove_node_connection', { 
        node_id: sourceNodeId, 
        connection_id: targetNodeId 
      })
      await supabase.rpc('remove_node_connection', { 
        node_id: targetNodeId, 
        connection_id: sourceNodeId 
      })
    } else {
      // Add to connection arrays
      await supabase.rpc('add_node_connection', { 
        node_id: sourceNodeId, 
        connection_id: targetNodeId 
      })
      await supabase.rpc('add_node_connection', { 
        node_id: targetNodeId, 
        connection_id: sourceNodeId 
      })
    }
  }

  private async calculateClusterCoherence(nodeIds: string[]): Promise<number> {
    // Calculate how well-connected the nodes in the cluster are
    const { data: connections } = await supabase
      .from('knowledge_connections')
      .select('strength')
      .in('source_node_id', nodeIds)
      .in('target_node_id', nodeIds)

    if (!connections || connections.length === 0) return 0

    const avgStrength = connections.reduce((sum, conn) => sum + conn.strength, 0) / connections.length
    const maxPossibleConnections = (nodeIds.length * (nodeIds.length - 1)) / 2
    const connectionDensity = connections.length / maxPossibleConnections

    return (avgStrength * 0.6) + (connectionDensity * 0.4)
  }

  private calculateRelevanceScore(node: KnowledgeNode, searchTerms: string[]): number {
    let score = 0
    const titleLower = node.title.toLowerCase()
    const contentLower = node.content.toLowerCase()
    
    // Title matches are weighted higher
    searchTerms.forEach(term => {
      if (titleLower.includes(term)) score += 3
      if (contentLower.includes(term)) score += 1
    })
    
    // Boost score based on importance and access count
    score += node.importance_score * 0.1
    score += Math.log(node.access_count + 1) * 0.1
    
    return score
  }

  private generateSnippet(content: string, searchTerms: string[], maxLength: number = 200): string {
    const contentLower = content.toLowerCase()
    
    // Find the first occurrence of any search term
    let bestIndex = -1
    for (const term of searchTerms) {
      const index = contentLower.indexOf(term)
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
        bestIndex = index
      }
    }
    
    if (bestIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
    }
    
    // Extract snippet around the found term
    const start = Math.max(0, bestIndex - 50)
    const end = Math.min(content.length, start + maxLength)
    
    let snippet = content.substring(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'
    
    return snippet
  }

  private findHighlightedTerms(node: KnowledgeNode, searchTerms: string[]): string[] {
    const highlighted: string[] = []
    const titleLower = node.title.toLowerCase()
    const contentLower = node.content.toLowerCase()
    
    searchTerms.forEach(term => {
      if (titleLower.includes(term) || contentLower.includes(term)) {
        highlighted.push(term)
      }
    })
    
    return highlighted
  }

  // Knowledge Graph Visualization
  async getKnowledgeGraph(centerNodeId?: string, depth: number = 2): Promise<APIResponse<any>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (centerNodeId && !await this.checkPermission(centerNodeId, userId)) {
        throw new Error('Access denied')
      }

      let nodeIds: string[] = []
      
      if (centerNodeId) {
        // Get nodes within specified depth from center node
        nodeIds = await this.getNodesWithinDepth(centerNodeId, depth)
      } else {
        // Get all user's nodes
        const { data: allNodes } = await supabase
          .from('knowledge_nodes')
          .select('id')
          .eq('user_id', userId)
        
        nodeIds = allNodes?.map(n => n.id) || []
      }

      // Get nodes and connections
      const [nodesResult, connectionsResult] = await Promise.all([
        supabase
          .from('knowledge_nodes')
          .select('*')
          .in('id', nodeIds),
        supabase
          .from('knowledge_connections')
          .select('*')
          .in('source_node_id', nodeIds)
          .in('target_node_id', nodeIds)
      ])

      return {
        data: {
          nodes: nodesResult.data || [],
          connections: connectionsResult.data || [],
          centerNode: centerNodeId
        }
      }
    })
  }

  private async getNodesWithinDepth(centerNodeId: string, depth: number): Promise<string[]> {
    const visited = new Set<string>([centerNodeId])
    const queue = [{ nodeId: centerNodeId, currentDepth: 0 }]
    
    while (queue.length > 0) {
      const { nodeId, currentDepth } = queue.shift()!
      
      if (currentDepth >= depth) continue
      
      const { data: connections } = await supabase
        .from('knowledge_connections')
        .select('source_node_id, target_node_id')
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`)
      
      if (connections) {
        for (const conn of connections) {
          const nextNodeId = conn.source_node_id === nodeId ? conn.target_node_id : conn.source_node_id
          
          if (!visited.has(nextNodeId)) {
            visited.add(nextNodeId)
            queue.push({ nodeId: nextNodeId, currentDepth: currentDepth + 1 })
          }
        }
      }
    }
    
    return Array.from(visited)
  }
}

export const knowledgeSynthesisAPI = new KnowledgeSynthesisAPI()