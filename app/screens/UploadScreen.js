'use client'

import { Camera, ChevronLeft, Sparkles, Zap, Trash2, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '../context/AppContext'
import { BUDGET_BRACKETS, ROOM_TYPES, OCCASIONS } from '../lib/constants'

export default function UploadScreen() {
  const { user, uploadForm, setUploadForm, originalImage, setOriginalImage, handleGenerate, handleFileUpload, goBack } = useApp()
  const selectedBudget = BUDGET_BRACKETS.find(b => b.id === uploadForm.budget)
  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="flex items-center gap-3 p-4">
        <button onClick={goBack} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-bold text-lg text-gray-800">Create Decoration</h1>
      </div>
      <div className="px-4 space-y-4">
        {/* Budget Selection - FIRST */}
        <Card className="border-2 border-pink-200 bg-pink-50/20">
          <CardContent className="p-4">
            <label className="text-sm font-semibold mb-2 block text-gray-700">
              <IndianRupee className="w-4 h-4 inline mr-1 text-pink-500" /> Select Budget <span className="text-pink-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_BRACKETS.map(b => {
                return (
                  <button key={b.id} onClick={() => setUploadForm(p => ({ ...p, budget: b.id }))}
                    className={`py-2.5 px-3 rounded-xl text-left transition-all relative ${
                      uploadForm.budget === b.id ? 'gradient-pink text-white shadow-pink' :
                      'bg-gray-50 text-gray-600 border border-gray-200 hover:border-pink-300'
                    }`}>
                    <p className="text-xs font-bold">{b.label}</p>
                    {b.min <= 3000 && <span className="text-[9px] opacity-70">Starter</span>}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Room Photo */}
        <Card className="border border-pink-100 bg-pink-50/30">
          <CardContent className="p-4">
            <label className="text-sm font-semibold mb-2 block text-gray-700">
              <Camera className="w-4 h-4 inline mr-1 text-pink-500" /> Room Photo <span className="text-pink-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">AI will decorate YOUR actual space</p>
            <div className="relative">
              {originalImage ? (
                <div className="relative">
                  <img src={originalImage} alt="Room" className="w-full h-48 object-cover rounded-xl border border-pink-100" />
                  <button onClick={() => setOriginalImage(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-pink-200 rounded-xl cursor-pointer hover:border-pink-400 transition-colors bg-white">
                  <Camera className="w-8 h-8 text-pink-300 mb-2" />
                  <p className="text-sm text-pink-400 font-medium">Tap to capture or upload</p>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Room Type */}
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            <label className="text-sm font-semibold mb-2 block text-gray-700">Room Type</label>
            <select value={uploadForm.room_type} onChange={e => setUploadForm(p => ({ ...p, room_type: e.target.value }))}
              className="w-full h-12 bg-gray-50 rounded-xl px-4 text-gray-700 border border-gray-200 outline-none focus:border-pink-400">
              {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </CardContent>
        </Card>

        {/* Occasion */}
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            <label className="text-sm font-semibold mb-2 block text-gray-700">Occasion</label>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map(o => (
                <button key={o} onClick={() => setUploadForm(p => ({ ...p, occasion: o }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${uploadForm.occasion === o ? 'gradient-pink text-white shadow-pink' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                  {o.replace('_', ' ')}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            <label className="text-sm font-semibold mb-2 block text-gray-700">Special Requests (Optional)</label>
            <textarea value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))}
              placeholder="E.g., Pastel theme with balloon arch, neon signs..."
              className="w-full h-20 bg-gray-50 rounded-xl p-3 text-gray-700 border border-gray-200 outline-none resize-none text-sm placeholder:text-gray-300 focus:border-pink-400" />
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>Uses 1 credit. You have <strong className="text-gray-700">{user?.credits || 0}</strong> credits.</span>
        </div>

        <Button onClick={handleGenerate} disabled={!originalImage || !uploadForm.budget || user?.credits <= 0}
          className="w-full h-14 gradient-pink border-0 text-white font-bold text-base rounded-2xl shadow-pink disabled:opacity-40">
          <Sparkles className="w-5 h-5 mr-2" /> Decorate My Space {selectedBudget ? `(${selectedBudget.label})` : ''}
        </Button>
      </div>
    </div>
  )
}
