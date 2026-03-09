'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeft, Sparkles, Camera, Truck, Package, Plus, Trash2,
  Loader2, CheckCircle2, Edit3, Image
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useApp } from '../context/AppContext'
import { SCREENS, api } from '../lib/constants'

// ===== SMART KIT CREATOR - uses top-level state =====
function SmartKitCreator() {
  const {
    scanImage, setScanImage, scanName, setScanName, scanning, setScanning,
    scanAnalysis, setScanAnalysis, items, setItems, showToast
  } = useApp()
  const [savedRefs, setSavedRefs] = useState([])
  const [kits, setKits] = useState([])
  useEffect(() => { api('kits/reference-images').then(d => { if (Array.isArray(d)) setSavedRefs(d) }) }, [])

  const handleScanUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => { setScanImage(ev.target?.result); setScanAnalysis(null) }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async () => {
    if (!scanImage) { showToast('Upload an image first', 'error'); return }
    setScanning(true); setScanAnalysis(null)
    try {
      const data = await api('kits/analyze', { method: 'POST', body: { image_base64: scanImage, name: scanName } })
      if (data.success) {
        setScanAnalysis(data)
        if (!scanName && data.decoration_type) setScanName(data.decoration_type)
        showToast('Analysis complete! Scroll down for full report.', 'success')
      } else { showToast('Analysis failed: ' + (data.error || 'Unknown'), 'error') }
    } catch (e) { showToast('Analysis failed', 'error') }
    finally { setScanning(false) }
  }

  const addItemsToStock = async () => {
    if (!scanAnalysis?.items) return
    const itemsToAdd = scanAnalysis.items.map(i => ({
      name: i.name, description: `Detected from: ${scanName || 'AI scan'}`,
      category: i.category || 'general', price: Number(i.estimated_unit_price) || 0,
      color: i.color || '', size: i.size || '',
      stock_count: Number(i.quantity) || 1,
      tags: [scanAnalysis.occasion_suggestion || 'universal'].filter(Boolean)
    }))
    const data = await api('items/bulk', { method: 'POST', body: { items: itemsToAdd } })
    if (!data.error) {
      showToast(`${data.count} items added to inventory!`, 'success')
      api('items').then(i => { if (!i.error) setItems(i) })
    } else { showToast(data.error, 'error') }
  }

  const saveAsKit = async () => {
    if (!scanAnalysis) return
    const kitName = scanName || scanAnalysis.decoration_type || `Kit ${new Date().toLocaleDateString()}`
    const data = await api('kits', {
      method: 'POST',
      body: {
        name: kitName, description: scanAnalysis.notes || scanAnalysis.decoration_type || '',
        occasion_tags: scanAnalysis.occasion_suggestion ? [scanAnalysis.occasion_suggestion] : [],
        room_types: scanAnalysis.room_suggestion ? [scanAnalysis.room_suggestion] : [],
        kit_items: (scanAnalysis.items || []).map(i => ({
          name: i.name, category: i.category, color: i.color,
          size: i.size, unit_price: Number(i.estimated_unit_price) || 0,
          quantity: Number(i.quantity) || 1
        })),
        labor_cost: Number(scanAnalysis.suggested_labor_cost) || 0,
        travel_cost: Number(scanAnalysis.suggested_travel_cost) || 500,
        decoration_charges: 0,
        final_price: Number(scanAnalysis.suggested_final_price) || 0,
        setup_time_minutes: Number(scanAnalysis.setup_time_minutes) || 60,
        color_theme: scanAnalysis.color_theme || '',
        difficulty: scanAnalysis.difficulty || 'medium',
        reference_images: scanImage ? [scanImage] : [],
        notes: scanAnalysis.notes || ''
      }
    })
    if (!data.error) {
      setKits(prev => [data, ...prev])
      showToast(`Kit "${kitName}" saved!`, 'success')
    } else { showToast(data.error, 'error') }
  }

  const saveRefImage = async () => {
    if (!scanImage || !scanName) { showToast('Name and image required', 'error'); return }
    const data = await api('kits/reference-images', {
      method: 'POST', body: { name: scanName, image_base64: scanImage, occasion: scanAnalysis?.occasion_suggestion || '', description: scanAnalysis?.decoration_type || '' }
    })
    if (!data.error) { setSavedRefs(prev => [{ ...data, has_image: true }, ...prev]); showToast('Reference saved!', 'success') }
  }

  const a = scanAnalysis
  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card className="border-2 border-pink-200 bg-pink-50/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h3 className="font-bold text-sm text-gray-700">AI Decoration Scanner</h3>
          </div>
          <p className="text-xs text-gray-400">Upload a photo. AI detects all items, counts units, estimates costs & generates a kit name.</p>
          <Input placeholder="Name (optional - AI will auto-name)" value={scanName} onChange={e => setScanName(e.target.value)} className="bg-white border-gray-200 h-10 rounded-lg" />
          {scanImage ? (
            <div className="relative">
              <img src={scanImage} alt="" className="w-full h-48 object-cover rounded-xl border border-pink-200" />
              <button onClick={() => { setScanImage(null); setScanAnalysis(null); setScanName('') }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg"><Trash2 className="w-4 h-4 text-white" /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-pink-300 rounded-xl cursor-pointer hover:border-pink-500 bg-white">
              <Camera className="w-8 h-8 text-pink-300 mb-2" />
              <p className="text-sm text-pink-400 font-medium">Upload Decoration Photo</p>
              <input type="file" accept="image/*" onChange={handleScanUpload} className="hidden" />
            </label>
          )}
          <Button onClick={analyzeImage} disabled={!scanImage || scanning}
            className="w-full h-12 gradient-pink border-0 text-white font-bold rounded-xl shadow-pink">
            {scanning ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing (10-20 sec)...</> : <><Sparkles className="w-4 h-4 mr-2" />Analyze with AI</>}
          </Button>
        </CardContent>
      </Card>

      {/* ===== ANALYSIS REPORT ===== */}
      {a && a.success && (
        <>
          {/* Summary Card */}
          <Card className="border-2 border-green-300 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-green-700">Analysis Report</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white rounded-lg p-2.5 border border-green-100 col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase">Kit Name (editable)</p>
                  <Input value={scanName || a.decoration_type} onChange={e => setScanName(e.target.value)}
                    className="bg-transparent border-0 h-7 p-0 text-sm font-bold text-gray-700 focus-visible:ring-0" />
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-green-100">
                  <p className="text-[10px] text-gray-400 uppercase">Color Theme</p>
                  <p className="text-sm font-semibold text-gray-700">{a.color_theme}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-green-100">
                  <p className="text-[10px] text-gray-400 uppercase">Best For</p>
                  <p className="text-sm font-semibold capitalize text-gray-700">{a.occasion_suggestion}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-green-100">
                  <p className="text-[10px] text-gray-400 uppercase">Setup Time</p>
                  <p className="text-sm font-semibold text-gray-700">{a.setup_time_minutes} minutes</p>
                </div>
              </div>
              {a.notes && <p className="text-xs text-gray-500 italic bg-white rounded-lg p-2 border border-green-100">{a.notes}</p>}
            </CardContent>
          </Card>

          {/* Itemized Report - EDITABLE */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h3 className="font-bold text-sm text-gray-700 mb-1">Detected Items ({(a.items || []).length})</h3>
              <p className="text-[10px] text-gray-400 mb-3">Edit names, quantities & prices below</p>
              <div className="space-y-2">
                {(a.items || []).map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="space-y-1.5">
                      <Input value={item.name} onChange={e => {
                        const updated = { ...a, items: [...a.items] }
                        updated.items[i] = { ...updated.items[i], name: e.target.value }
                        setScanAnalysis(updated)
                      }} className="bg-white border-gray-200 h-8 rounded text-xs font-bold" />
                      <div className="flex gap-1.5">
                        <div className="flex-1">
                          <label className="text-[9px] text-gray-400">Color</label>
                          <Input value={item.color} onChange={e => {
                            const updated = { ...a, items: [...a.items] }
                            updated.items[i] = { ...updated.items[i], color: e.target.value }
                            setScanAnalysis(updated)
                          }} className="bg-white border-gray-200 h-7 rounded text-[11px]" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] text-gray-400">Category</label>
                          <Input value={item.category} onChange={e => {
                            const updated = { ...a, items: [...a.items] }
                            updated.items[i] = { ...updated.items[i], category: e.target.value }
                            setScanAnalysis(updated)
                          }} className="bg-white border-gray-200 h-7 rounded text-[11px]" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] text-gray-400">Size</label>
                          <Input value={item.size} onChange={e => {
                            const updated = { ...a, items: [...a.items] }
                            updated.items[i] = { ...updated.items[i], size: e.target.value }
                            setScanAnalysis(updated)
                          }} className="bg-white border-gray-200 h-7 rounded text-[11px]" />
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-end">
                        <div className="w-20">
                          <label className="text-[9px] text-gray-400">Quantity</label>
                          <Input type="number" value={item.quantity} onChange={e => {
                            const updated = { ...a, items: [...a.items] }
                            updated.items[i] = { ...updated.items[i], quantity: Number(e.target.value) || 0 }
                            updated.total_items_cost = updated.items.reduce((s, it) => s + (it.estimated_unit_price * it.quantity), 0)
                            updated.suggested_final_price = updated.total_items_cost + (updated.suggested_labor_cost || 0) + (updated.suggested_travel_cost || 500)
                            setScanAnalysis(updated)
                          }} className="bg-white border-pink-200 h-8 rounded text-xs font-bold text-center" />
                        </div>
                        <div className="w-24">
                          <label className="text-[9px] text-gray-400">Rs per piece</label>
                          <Input type="number" value={item.estimated_unit_price} onChange={e => {
                            const updated = { ...a, items: [...a.items] }
                            updated.items[i] = { ...updated.items[i], estimated_unit_price: Number(e.target.value) || 0 }
                            updated.total_items_cost = updated.items.reduce((s, it) => s + (it.estimated_unit_price * it.quantity), 0)
                            updated.suggested_final_price = updated.total_items_cost + (updated.suggested_labor_cost || 0) + (updated.suggested_travel_cost || 500)
                            setScanAnalysis(updated)
                          }} className="bg-white border-pink-200 h-8 rounded text-xs font-bold text-center" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-bold text-green-600">= Rs {(item.estimated_unit_price || 0) * (item.quantity || 0)}</p>
                        </div>
                        <button onClick={() => {
                          const updated = { ...a, items: a.items.filter((_, idx) => idx !== i) }
                          updated.total_items_cost = updated.items.reduce((s, it) => s + (it.estimated_unit_price * it.quantity), 0)
                          updated.suggested_final_price = updated.total_items_cost + (updated.suggested_labor_cost || 0) + (updated.suggested_travel_cost || 500)
                          setScanAnalysis(updated)
                        }} className="w-7 h-7 rounded bg-red-50 flex items-center justify-center shrink-0">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Add new item button */}
                <button onClick={() => {
                  const updated = { ...a, items: [...(a.items || []), { name: 'New Item', category: 'other', color: '', size: '', quantity: 1, estimated_unit_price: 0 }] }
                  setScanAnalysis(updated)
                }} className="w-full py-2 border-2 border-dashed border-pink-200 rounded-lg text-xs text-pink-400 font-semibold hover:border-pink-400 flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary - EDITABLE */}
          <Card className="border-2 border-pink-200 bg-pink-50/30">
            <CardContent className="p-4">
              <h3 className="font-bold text-sm text-gray-700 mb-2">Cost Summary (editable)</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Items Cost</span>
                  <span className="font-semibold">Rs {a.total_items_cost}</span>
                </div>
                <div className="flex justify-between items-center text-sm gap-2">
                  <span className="text-gray-500">Labor Cost</span>
                  <Input type="number" value={a.suggested_labor_cost || 0} onChange={e => {
                    const labor = Number(e.target.value) || 0
                    setScanAnalysis(prev => ({ ...prev, suggested_labor_cost: labor, suggested_final_price: prev.total_items_cost + labor + (prev.suggested_travel_cost || 500) }))
                  }} className="w-24 h-7 bg-white border-pink-200 rounded text-xs text-right font-semibold" />
                </div>
                <div className="flex justify-between items-center text-sm gap-2">
                  <span className="text-gray-500">Travel Cost</span>
                  <Input type="number" value={a.suggested_travel_cost || 500} onChange={e => {
                    const travel = Number(e.target.value) || 0
                    setScanAnalysis(prev => ({ ...prev, suggested_travel_cost: travel, suggested_final_price: prev.total_items_cost + (prev.suggested_labor_cost || 0) + travel }))
                  }} className="w-24 h-7 bg-white border-pink-200 rounded text-xs text-right font-semibold" />
                </div>
                <div className="flex justify-between items-center text-base pt-2 border-t border-pink-200">
                  <span className="font-bold text-gray-700">Final Price</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">Rs</span>
                    <Input type="number" value={a.suggested_final_price || 0} onChange={e => {
                      setScanAnalysis(prev => ({ ...prev, suggested_final_price: Number(e.target.value) || 0 }))
                    }} className="w-28 h-8 bg-white border-pink-300 rounded text-sm text-right font-bold text-pink-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button onClick={saveAsKit} className="w-full h-12 gradient-pink border-0 text-white font-bold rounded-xl shadow-pink">
              <Plus className="w-4 h-4 mr-2" /> Save as Kit: "{scanName || a.decoration_type}"
            </Button>
            <Button onClick={addItemsToStock} variant="outline" className="w-full h-11 border-green-300 text-green-600 font-semibold rounded-xl hover:bg-green-50">
              <Package className="w-4 h-4 mr-2" /> Add All Items to Inventory Stock
            </Button>
            <Button onClick={saveRefImage} disabled={!scanName} variant="outline" className="w-full h-11 border-purple-300 text-purple-600 font-semibold rounded-xl hover:bg-purple-50">
              <Image className="w-4 h-4 mr-2" /> Save Reference Image
            </Button>
          </div>
        </>
      )}

      {/* Saved References */}
      {savedRefs.length > 0 && (
        <div>
          <h3 className="font-bold text-sm text-gray-700 mb-2">Saved References ({savedRefs.length})</h3>
          <div className="grid grid-cols-3 gap-2">
            {savedRefs.map(ref => (
              <div key={ref.id} className="relative">
                <div className="w-full aspect-square rounded-lg bg-pink-50 flex items-center justify-center border border-gray-200"><Image className="w-6 h-6 text-pink-300" /></div>
                <p className="text-[10px] text-gray-600 mt-1 truncate">{ref.name}</p>
                <button onClick={async () => {
                  await api(`kits/reference-images/${ref.id}`, { method: 'DELETE' })
                  setSavedRefs(p => p.filter(r => r.id !== ref.id))
                }} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><Trash2 className="w-3 h-3 text-white" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminScreen() {
  const { navigate, items, setItems, deliveryPersons, setDeliveryPersons, adminTab: tab, setAdminTab: setTab, showToast } = useApp()
  const [newItem, setNewItem] = useState({ name: '', description: '', category: 'balloon_arch', price: '', stock_count: '', tags: '', color: '', material: '', size: '' })
  const [newDp, setNewDp] = useState({ name: '', phone: '' })
  const [editingItem, setEditingItem] = useState(null)
  const [kits, setKits] = useState([])
  const [newKit, setNewKit] = useState({
    name: '', description: '', occasion_tags: '', room_types: '',
    labor_cost: '', final_price: '', setup_time_minutes: '60',
    color_theme: '', notes: '', difficulty: 'medium'
  })
  const [kitItems, setKitItems] = useState([])
  const [newKitItem, setNewKitItem] = useState({ name: '', description: '', category: '', color: '', size: '', unit_price: '', quantity: '1' })
  const [kitRefImages, setKitRefImages] = useState([])

  useEffect(() => { api('kits').then(d => { if (!d.error) setKits(d) }) }, [])

  const addKitRefImage = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setKitRefImages(prev => [...prev, ev.target?.result])
      reader.readAsDataURL(file)
    }
  }

  const addKitItem = () => {
    if (!newKitItem.name || !newKitItem.unit_price) { showToast('Item name and price required', 'error'); return }
    setKitItems(prev => [...prev, { ...newKitItem, unit_price: Number(newKitItem.unit_price), quantity: Number(newKitItem.quantity) || 1 }])
    setNewKitItem({ name: '', description: '', category: '', color: '', size: '', unit_price: '', quantity: '1' })
  }

  const saveKit = async () => {
    if (!newKit.name) { showToast('Kit name required', 'error'); return }
    const data = await api('kits', {
      method: 'POST',
      body: {
        ...newKit,
        occasion_tags: newKit.occasion_tags.split(',').map(t => t.trim()).filter(Boolean),
        room_types: newKit.room_types.split(',').map(t => t.trim()).filter(Boolean),
        labor_cost: Number(newKit.labor_cost) || 0,
        final_price: Number(newKit.final_price) || 0,
        setup_time_minutes: Number(newKit.setup_time_minutes) || 60,
        kit_items: kitItems,
        reference_images: kitRefImages
      }
    })
    if (!data.error) {
      setKits(prev => [data, ...prev])
      setNewKit({ name: '', description: '', occasion_tags: '', room_types: '', labor_cost: '', final_price: '', setup_time_minutes: '60', color_theme: '', notes: '', difficulty: 'medium' })
      setKitItems([]); setKitRefImages([])
      showToast('Decoration Kit saved!', 'success')
    }
  }

  const deleteKit = async (id) => {
    await api(`kits/${id}`, { method: 'DELETE' })
    setKits(prev => prev.filter(k => k.id !== id))
    showToast('Kit deleted', 'success')
  }

  const addItem = async () => {
    if (!newItem.name || !newItem.price) { showToast('Name and price required', 'error'); return }
    const data = await api('items', {
      method: 'POST',
      body: { ...newItem, price: Number(newItem.price), stock_count: Number(newItem.stock_count) || 0, tags: newItem.tags.split(',').map(t => t.trim()).filter(Boolean) }
    })
    if (!data.error) { setItems(prev => [...prev, data]); setNewItem({ name: '', description: '', category: 'balloon_arch', price: '', stock_count: '', tags: '', color: '', material: '', size: '' }); showToast('Item added!', 'success') }
  }

  const updateItem = async (id, updates) => {
    const data = await api(`items/${id}`, { method: 'PUT', body: updates })
    if (!data.error) { setItems(prev => prev.map(i => i.id === id ? data : i)); setEditingItem(null); showToast('Updated!', 'success') }
  }

  const deleteItem = async (id) => {
    await api(`items/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    showToast('Deleted', 'success')
  }

  const addDeliveryPerson = async () => {
    if (!newDp.name) { showToast('Name required', 'error'); return }
    const data = await api('delivery-persons', { method: 'POST', body: newDp })
    if (!data.error) { setDeliveryPersons(prev => [...prev, data]); setNewDp({ name: '', phone: '' }); showToast('Added!', 'success') }
  }

  const categories = ['balloon_arch', 'balloon_wall', 'balloons', 'neon_signs', 'backdrop', 'props', 'lights', 'table_decor', 'banners', 'flowers', 'drapes', 'general']

  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(SCREENS.HOME)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h1 className="font-bold text-lg text-gray-800">Admin Panel</h1>
      </div>
      <div className="px-4">
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {['smart', 'kits', 'items', 'delivery'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${tab === t ? 'gradient-pink text-white shadow-pink' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
              {t === 'smart' ? 'AI Scanner' : t === 'kits' ? 'Kits' : t === 'items' ? 'Inventory' : 'Team'}
            </button>
          ))}
        </div>

        {/* AI Smart Kit Creator */}
        {tab === 'smart' && <SmartKitCreator />}

        {tab === 'kits' && (
          <div className="space-y-3">
            {/* Kit Builder Form */}
            <Card className="border border-pink-100">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm text-gray-700">Create Decoration Kit</h3>
                <Input placeholder="Kit Name (e.g., Birthday Pastel Balloon Setup)" value={newKit.name} onChange={e => setNewKit(p => ({ ...p, name: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                <textarea placeholder="Description (what this kit looks like, style, theme...)" value={newKit.description} onChange={e => setNewKit(p => ({ ...p, description: e.target.value }))}
                  className="w-full h-16 bg-gray-50 rounded-lg p-3 text-sm border border-gray-200 outline-none resize-none" />

                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Occasions (birthday,wedding)" value={newKit.occasion_tags} onChange={e => setNewKit(p => ({ ...p, occasion_tags: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg text-xs" />
                  <Input placeholder="Rooms (Living Room,Hall)" value={newKit.room_types} onChange={e => setNewKit(p => ({ ...p, room_types: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg text-xs" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Labor Rs" type="number" value={newKit.labor_cost} onChange={e => setNewKit(p => ({ ...p, labor_cost: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg text-xs" />
                  <Input placeholder="Travel Rs" type="number" value={newKit.travel_cost || ''} onChange={e => setNewKit(p => ({ ...p, travel_cost: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg text-xs" />
                  <Input placeholder="Final Price" type="number" value={newKit.final_price} onChange={e => setNewKit(p => ({ ...p, final_price: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg text-xs" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Decor Chrg Rs" type="number" value={newKit.decoration_charges || ''} onChange={e => setNewKit(p => ({ ...p, decoration_charges: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg text-xs" />
                  <Input placeholder="Setup (min)" type="number" value={newKit.setup_time_minutes} onChange={e => setNewKit(p => ({ ...p, setup_time_minutes: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Color Theme" value={newKit.color_theme} onChange={e => setNewKit(p => ({ ...p, color_theme: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg text-xs" />
                  <select value={newKit.difficulty} onChange={e => setNewKit(p => ({ ...p, difficulty: e.target.value }))} className="h-10 bg-gray-50 rounded-lg px-3 text-xs border border-gray-200">
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>

                {/* Reference Images */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Reference Photos (past work)</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {kitRefImages.map((img, i) => (
                      <div key={i} className="shrink-0 relative">
                        <img src={img} alt="" className="w-20 h-20 rounded-lg object-cover border border-pink-200" />
                        <button onClick={() => setKitRefImages(p => p.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><Trash2 className="w-3 h-3 text-white" /></button>
                      </div>
                    ))}
                    <label className="shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-pink-200 flex items-center justify-center cursor-pointer hover:border-pink-400">
                      <Plus className="w-5 h-5 text-pink-300" />
                      <input type="file" accept="image/*" onChange={addKitRefImage} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Kit Items */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Kit Items (add each item in this kit)</label>
                  {kitItems.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {kitItems.map((ki, i) => (
                        <div key={i} className="flex items-center gap-2 bg-pink-50 rounded-lg p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{ki.quantity}x {ki.name}</p>
                            <p className="text-[10px] text-gray-400">{ki.color} {ki.size ? `• ${ki.size}` : ''} • Rs {ki.unit_price}/pc</p>
                          </div>
                          <p className="text-xs font-bold text-pink-500 shrink-0">Rs {ki.unit_price * ki.quantity}</p>
                          <button onClick={() => setKitItems(p => p.filter((_, idx) => idx !== i))} className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="w-3 h-3 text-red-400" /></button>
                        </div>
                      ))}
                      <p className="text-xs font-bold text-pink-500 text-right">Items Total: Rs {kitItems.reduce((s, ki) => s + ki.unit_price * ki.quantity, 0)}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-2 space-y-1.5 border border-gray-200">
                    <Input placeholder="Item Name (e.g., Small Latex Balloon)" value={newKitItem.name} onChange={e => setNewKitItem(p => ({ ...p, name: e.target.value }))} className="bg-white border-gray-200 h-9 rounded-lg text-xs" />
                    <div className="grid grid-cols-3 gap-1">
                      <Input placeholder="Color" value={newKitItem.color} onChange={e => setNewKitItem(p => ({ ...p, color: e.target.value }))} className="bg-white border-gray-200 h-9 rounded-lg text-xs" />
                      <Input placeholder="Size" value={newKitItem.size} onChange={e => setNewKitItem(p => ({ ...p, size: e.target.value }))} className="bg-white border-gray-200 h-9 rounded-lg text-xs" />
                      <Input placeholder="Category" value={newKitItem.category} onChange={e => setNewKitItem(p => ({ ...p, category: e.target.value }))} className="bg-white border-gray-200 h-9 rounded-lg text-xs" />
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <Input placeholder="Price/pc Rs" type="number" value={newKitItem.unit_price} onChange={e => setNewKitItem(p => ({ ...p, unit_price: e.target.value }))} className="bg-white border-gray-200 h-9 rounded-lg text-xs" />
                      <Input placeholder="Qty" type="number" value={newKitItem.quantity} onChange={e => setNewKitItem(p => ({ ...p, quantity: e.target.value }))} className="bg-white border-gray-200 h-9 rounded-lg text-xs" />
                      <Button onClick={addKitItem} size="sm" className="h-9 gradient-pink border-0 text-white text-xs rounded-lg"><Plus className="w-3 h-3 mr-1" />Add</Button>
                    </div>
                  </div>
                </div>

                <Input placeholder="Admin Notes" value={newKit.notes} onChange={e => setNewKit(p => ({ ...p, notes: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg text-xs" />

                <Button onClick={saveKit} className="w-full gradient-pink border-0 text-white font-bold rounded-xl shadow-pink">
                  <Plus className="w-4 h-4 mr-1" /> Save Decoration Kit
                </Button>
              </CardContent>
            </Card>

            {/* Existing Kits List */}
            <p className="text-xs text-gray-400">{kits.length} decoration kits</p>
            {kits.map(kit => (
              <Card key={kit.id} className="border border-gray-100">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {kit.reference_images?.[0] ? (
                      <img src={kit.reference_images[0]} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-pink-50 flex items-center justify-center shrink-0"><Package className="w-6 h-6 text-pink-300" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700 truncate">{kit.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{kit.occasion_tags?.join(', ')} • {kit.color_theme}</p>
                      <p className="text-[10px] text-gray-400">{(kit.kit_items || []).length} items • Setup: {kit.setup_time_minutes}min</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-pink-500">Rs {kit.final_price}</span>
                        <Badge className={kit.is_active ? 'bg-green-100 text-green-600 text-[9px]' : 'bg-gray-100 text-gray-500 text-[9px]'}>{kit.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </div>
                    <button onClick={() => deleteKit(kit.id)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                  {(kit.kit_items || []).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">Kit Contents:</p>
                      {kit.kit_items.slice(0, 5).map((ki, i) => (
                        <p key={i} className="text-[10px] text-gray-400">{ki.quantity}x {ki.name} ({ki.color}) - Rs {ki.unit_price}/pc = Rs {ki.unit_price * ki.quantity}</p>
                      ))}
                      {kit.kit_items.length > 5 && <p className="text-[10px] text-gray-300">+{kit.kit_items.length - 5} more items</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {tab === 'items' && (
          <div className="space-y-3">
            <Card className="border border-pink-100">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-gray-700 mb-2">Add New Item</h3>
                <Input placeholder="Item Name *" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                <Input placeholder="Description" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} className="h-10 bg-gray-50 rounded-lg px-3 text-sm border border-gray-200">
                    {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                  <Input placeholder="Color" value={newItem.color} onChange={e => setNewItem(p => ({ ...p, color: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Material" value={newItem.material} onChange={e => setNewItem(p => ({ ...p, material: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                  <Input placeholder="Size" value={newItem.size} onChange={e => setNewItem(p => ({ ...p, size: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Price (Rs) *" type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                  <Input placeholder="Stock Count" type="number" value={newItem.stock_count} onChange={e => setNewItem(p => ({ ...p, stock_count: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                </div>
                <Input placeholder="Tags (comma-separated)" value={newItem.tags} onChange={e => setNewItem(p => ({ ...p, tags: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                <Button onClick={addItem} className="w-full gradient-pink border-0 text-white shadow-pink"><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
              </CardContent>
            </Card>
            <p className="text-xs text-gray-400">{items.length} items in inventory</p>
            {items.map(item => (
              <Card key={item.id} className="border border-gray-100">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-pink-400" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{item.category?.replace('_', ' ')} {item.color ? `• ${item.color}` : ''}</p>
                      <div className="flex gap-2 text-[10px] text-gray-400">
                        <span>Rs {item.price}</span>
                        <span>Stock: {item.stock_count}</span>
                        {item.material && <span>• {item.material}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => {
                        const newStock = prompt('Update stock count:', item.stock_count)
                        if (newStock !== null) updateItem(item.id, { stock_count: Number(newStock) })
                      }} className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><Edit3 className="w-3 h-3 text-blue-500" /></button>
                      <button onClick={() => deleteItem(item.id)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="w-3 h-3 text-red-400" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {tab === 'delivery' && (
          <div className="space-y-3">
            <Card className="border border-pink-100">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-gray-700 mb-2">Add Delivery Person</h3>
                <Input placeholder="Name" value={newDp.name} onChange={e => setNewDp(p => ({ ...p, name: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                <Input placeholder="Phone" value={newDp.phone} onChange={e => setNewDp(p => ({ ...p, phone: e.target.value }))} className="bg-gray-50 border-gray-200 h-10 rounded-lg" />
                <Button onClick={addDeliveryPerson} className="w-full gradient-pink border-0 text-white shadow-pink"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </CardContent>
            </Card>
            {deliveryPersons.map(dp => (
              <Card key={dp.id} className="border border-gray-100">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center"><Truck className="w-5 h-5 text-white" /></div>
                  <div><p className="text-sm font-semibold text-gray-700">{dp.name}</p><p className="text-xs text-gray-400">{dp.phone}</p></div>
                  <Badge className={`ml-auto ${dp.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{dp.is_active ? 'Active' : 'Inactive'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
