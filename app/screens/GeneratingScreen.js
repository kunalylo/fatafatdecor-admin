'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function GeneratingScreen() {
  const { uploadForm } = useApp()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="relative mb-8">
        <div className="w-24 h-24 gradient-pink rounded-3xl flex items-center justify-center pulse-glow-pink">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -inset-4 border-2 border-pink-200 rounded-[2rem] animate-ping" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Decorating Your Space</h2>
      <p className="text-gray-400 text-sm text-center mb-4">AI is adding decorations to your {uploadForm.room_type}...</p>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
        <span>This may take up to 60 seconds</span>
      </div>
      <div className="mt-8 w-48 h-1.5 bg-pink-100 rounded-full overflow-hidden">
        <div className="h-full gradient-pink rounded-full shimmer" style={{ width: '60%' }} />
      </div>
    </div>
  )
}
