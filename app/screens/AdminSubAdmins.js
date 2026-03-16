'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/constants'
import { useApp } from '../context/AppContext'
import {
  UserCog, Plus, Pencil, Trash2, X, Check, Loader2,
  Mail, Lock, User, Shield, AlertTriangle, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// All permission options matching the nav tab IDs
const PERMISSION_OPTIONS = [
  { id: 'orders',   label: 'Orders',      desc: 'View and manage orders' },
  { id: 'smart',    label: 'AI Scanner',  desc: 'Use AI item scanner' },
  { id: 'kits',     label: 'Kits',        desc: 'Create and edit kits' },
  { id: 'items',    label: 'Inventory',   desc: 'Manage inventory items' },
  { id: 'delivery', label: 'Team',        desc: 'Manage decorator team' },
  { id: 'slots',    label: 'Slots',       desc: 'Manage delivery slots' },
  { id: 'users',    label: 'Customers',   desc: 'View and edit customers' },
  { id: 'cities',   label: 'Cities',      desc: 'Add/remove allowed cities' },
]

const EMPTY_FORM = { name: '', email: '', password: '', permissions: [] }

export default function AdminSubAdmins() {
  const { showToast } = useApp()
  const [subAdmins, setSubAdmins]   = useState([])
  const [loading, setLoading]       = useState(false)
  const [fetching, setFetching]     = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editId, setEditId]         = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch]         = useState('')

  const fetchSubAdmins = useCallback(async () => {
    setFetching(true)
    const d = await api('admin/sub-admins')
    if (!d.error) setSubAdmins(d)
    setFetching(false)
  }, [])

  useEffect(() => { fetchSubAdmins() }, [fetchSubAdmins])

  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (sa) => {
    setEditId(sa.id || sa._id)
    setForm({ name: sa.name, email: sa.email, password: '', permissions: sa.permissions || [] })
    setShowForm(true)
  }

  const togglePerm = (id) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(id)
        ? f.permissions.filter(p => p !== id)
        : [...f.permissions, id]
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim())  { showToast('Name is required', 'error'); return }
    if (!form.email.trim()) { showToast('Email is required', 'error'); return }
    if (!editId && !form.password.trim()) { showToast('Password is required', 'error'); return }
    if (form.permissions.length === 0) { showToast('Select at least one permission', 'error'); return }

    setLoading(true)
    const body = { name: form.name, email: form.email, permissions: form.permissions }
    if (form.password) body.password = form.password

    const endpoint = editId ? `admin/sub-admins/${editId}` : 'admin/sub-admins'
    const method   = editId ? 'PUT' : 'POST'
    const d = await api(endpoint, { method, body })
    setLoading(false)

    if (d.error) { showToast(d.error, 'error'); return }
    showToast(editId ? 'Sub-admin updated' : 'Sub-admin created', 'success')
    setShowForm(false)
    fetchSubAdmins()
  }

  const handleDelete = async (id) => {
    setLoading(true)
    const d = await api(`admin/sub-admins/${id}`, { method: 'DELETE' })
    setLoading(false)
    setDeleteConfirm(null)
    if (d.error) { showToast(d.error, 'error'); return }
    showToast('Sub-admin deleted', 'success')
    setSubAdmins(prev => prev.filter(s => (s.id || s._id) !== id))
  }

  const filtered = subAdmins.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Sub-Admins</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage team members with limited access</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-pink-500 hover:bg-pink-600 text-white border-0 rounded-xl h-10 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Sub-Admin
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {fetching ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserCog className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{search ? 'No results found' : 'No sub-admins yet'}</p>
            {!search && (
              <Button onClick={openCreate} variant="outline" className="mt-4 rounded-xl border-pink-200 text-pink-500">
                <Plus className="w-4 h-4 mr-2" /> Create First Sub-Admin
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Permissions</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(sa => (
                  <tr key={sa.id || sa._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-orange-500 text-xs font-bold">{(sa.name?.[0] || 'S').toUpperCase()}</span>
                        </div>
                        <p className="font-semibold text-gray-700 text-sm">{sa.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{sa.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(sa.permissions || []).map(p => {
                          const opt = PERMISSION_OPTIONS.find(o => o.id === p)
                          return opt ? (
                            <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-50 text-pink-600 text-[10px] font-semibold rounded-full">
                              <Shield className="w-2.5 h-2.5" />
                              {opt.label}
                            </span>
                          ) : null
                        })}
                        {(!sa.permissions || sa.permissions.length === 0) && (
                          <span className="text-xs text-gray-400 italic">No permissions</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(sa)}
                          className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(sa)}
                          className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-pink-100 rounded-xl flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-pink-500" />
                </div>
                <h3 className="font-bold text-gray-800">{editId ? 'Edit Sub-Admin' : 'Create Sub-Admin'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="e.g. Priya Sharma"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="pl-9 h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="email@example.com"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="pl-9 h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                  Password {editId && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder={editId ? 'Enter new password to change' : 'Set a password'}
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="pl-9 h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">
                  Permissions
                  <span className="ml-1 text-gray-400 font-normal">({form.permissions.length} selected)</span>
                </label>
                <div className="space-y-2">
                  {PERMISSION_OPTIONS.map(opt => {
                    const checked = form.permissions.includes(opt.id)
                    return (
                      <button
                        key={opt.id}
                        onClick={() => togglePerm(opt.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                          ${checked
                            ? 'border-pink-400 bg-pink-50'
                            : 'border-gray-100 bg-white hover:border-gray-200'}`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors
                          ${checked ? 'bg-pink-500' : 'bg-gray-100'}`}>
                          {checked && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${checked ? 'text-pink-700' : 'text-gray-700'}`}>{opt.label}</p>
                          <p className="text-[11px] text-gray-400">{opt.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 pt-0 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 h-11 rounded-xl border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-pink-500 hover:bg-pink-600 text-white border-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editId ? 'Save Changes' : 'Create Sub-Admin')}
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
                <h3 className="font-bold text-gray-800">Delete Sub-Admin?</h3>
                <p className="text-xs text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete <span className="font-semibold text-gray-800">{deleteConfirm.name}</span>? They will lose all access immediately.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-11 rounded-xl border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm.id || deleteConfirm._id)}
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
