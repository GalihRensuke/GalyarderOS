// Test setup file

import { beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock environment variables
Object.defineProperty(process.env, 'VITE_SUPABASE_URL', {
  value: 'https://test.supabase.co',
  writable: true
})

Object.defineProperty(process.env, 'VITE_SUPABASE_ANON_KEY', {
  value: 'test-anon-key',
  writable: true
})

Object.defineProperty(process.env, 'VITE_GEMINI_API_KEY', {
  value: 'test-gemini-key',
  writable: true
})

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn()
    })),
    rpc: vi.fn()
  }
}))

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    form: 'form',
    input: 'input',
    textarea: 'textarea'
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children
}))

// Mock React Hot Toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  },
  Toaster: () => null
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Global test setup
beforeAll(() => {
  // Setup global test environment
})

afterAll(() => {
  // Cleanup global test environment
})