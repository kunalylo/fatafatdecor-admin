'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/constants'
import { useApp } from '../context/AppContext'
import {
  MapPin, Plus, Pencil, Trash2, X, Loader2,
  AlertTriangle, ToggleLeft, ToggleRight, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMPTY_FORM = { name: '', state: '' }

export default function AdminCities() {
  const { showToast } = useApp()
  const [cities, setCities]       = useState([])
  const [fetching, setFetching]   = useState(true)
  const [loading, setLoading]     = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [editCity, setEditCity]   = useState(null)   // city object being edited
  const [form, setForm]           = useState(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchCities = useCallback(async () => {
    setFetching(true)
    const d = await api('cities')
    if (!d.error) setCities(Array.isArray(d) ? d : [])
    setFetching(false)
  }, [])

  useEffect(() => { fetchCities() }, [fetchCities])

  const openCreate = () => {
    setEditCity(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (city) => {
    setEditCity(city)
    setForm({ name: city.name, state: city.state || '' })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('City name is required', 'error'); return }

    setLoading(true)
    const body = { name: form.name.trim(), state: form.state.trim() }

    if (editCity) {
      const d = await api(`cities/${editCity.id}`, { method: 'PUT', body })
      setLoading(false)
      if (d.error) { showToast(d.error, 'error'); return }
      showToast('City updated', 'success')
      setCities(prev => prev.map(c => c.id === editCity.id ? { ...c, ...body } : c))
    } else {
      const d = await api('cities', { method: 'POST', body })
      setLoading(false)
      if (d.error) { showToast(d.error, 'error'); return }
      showToast('City added', 'success')
      setCities(prev => [...prev, d].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setShowForm(false)
  }

  const handleToggleActive = async (city) => {
    const d = await api(`cities/${city.id}`, { method: 'PUT', body: { active: !city.active } })
    if (d.error) { showToast(d.error, 'error'); return }
    setCities(prev => prev.map(c => c.id === city.id ? { ...c, active: !city.active } : c))
    showToast(`${city.name} ${!city.active ? 'activated' : 'deactivated'}`, 'success')
  }

  const handleDelete = async (id) => {
    setLoading(true)
    const d = await api(`cities/${id}`, { method: 'DELETE' })
    setLoading(false)
    setDeleteConfirm(null)
    if (d.error) { showToast(d.error, 'error'); return }
    showToast('City deleted', 'success')
    setCities(prev => prev.filter(c => c.id !== id))
  }

  const activeCount   = cities.filter(c => c.active).length
  const inactiveCount = cities.filter(c => !c.active).length

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Cities</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            <span className="text-green-600 font-semibold">{activeCount} active</span>
            {inactiveCount > 0 && <span className="text-gray-400"> · {inactiveCount} inactive</span>}
            {' '}— only active cities accept orders
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-pink-500 hover:bg-pink-600 text-white border-0 rounded-xl h-10 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add City
        </Button>
      </div>

      {/* City Grid */}
      {fetching ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        </div>
      ) : cities.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16">
          <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No cities added yet</p>
          <Button onClick={openCreate} variant="outline" className="mt-4 rounded-xl border-pink-200 text-pink-500">
            <Plus className="w-4 h-4 mr-2" /> Add First City
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cities.map(city => (
            <div
              key={city.id}
              className={`bg-white rounded-2xl border-2 shadow-sm p-5 transition-all
                ${city.active ? 'border-green-100' : 'border-gray-100 opacity-60'}`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    ${city.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <MapPin className={`w-5 h-5 ${city.active ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm leading-tight">{city.name}</p>
                    <p className="text-xs text-gray-400">{city.state || 'No state'}</p>
                  </div>
                </div>
                {/* Active toggle */}
                <button
                  onClick={() => handleToggleActive(city)}
                  title={city.active ? 'Deactivate city' : 'Activate city'}
                  className="shrink-0 ml-1"
                >
                  {city.active
                    ? <ToggleRight className="w-7 h-7 text-green-500" />
                    : <ToggleLeft  className="w-7 h-7 text-gray-300" />}
                </button>
              </div>

              {/* Status badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold
                  ${city.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {city.active ? <><Check className="w-3 h-3" /> Active</> : 'Inactive'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(city)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-500 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(city)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-400 text-xs font-semibold hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-pink-500" />
                </div>
                <h3 className="font-bold text-gray-800">{editCity ? 'Edit City' : 'Add City'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">City Name <span className="text-red-400">*</span></label>
                <Input
                  placeholder="e.g. Ranchi"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="h-11 rounded-xl border-gray-200"
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">State</label>
                <Input
                  placeholder="e.g. Jharkhand"
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  className="h-11 rounded-xl border-gray-200"
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-xl border-gray-200">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-pink-500 hover:bg-pink-600 text-white border-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editCity ? 'Save Changes' : 'Add City')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Delete City?</h3>
                <p className="text-xs text-gray-400">Orders from this city won't be accepted</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Remove <span className="font-semibold text-gray-800">{deleteConfirm.name}</span>
              {deleteConfirm.state ? `, ${deleteConfirm.state}` : ''} from the allowed cities list?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 h-11 rounded-xl border-gray-200">
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
