'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/constants'
import { useApp } from '../context/AppContext'
import {
  UserCheck, Search, Pencil, Trash2, X, Loader2,
  Mail, Phone, User, Lock, AlertTriangle, ShoppingBag, Zap, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMPTY_EDIT = { name: '', email: '', phone: '', credits: 0, new_password: '' }

export default function AdminUsers() {
  const { showToast } = useApp()
  const [users, setUsers]             = useState([])
  const [fetching, setFetching]       = useState(true)
  const [loading, setLoading]         = useState(false)
  const [search, setSearch]           = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [editUser, setEditUser]       = useState(null)   // user object being edited
  const [form, setForm]               = useState(EMPTY_EDIT)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [page, setPage]               = useState(1)
  const PAGE_SIZE = 20

  const fetchUsers = useCallback(async (q = '') => {
    setFetching(true)
    const url = q ? `admin/users?search=${encodeURIComponent(q)}` : 'admin/users'
    const d = await api(url)
    if (!d.error) setUsers(Array.isArray(d) ? d : [])
    setFetching(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      setSearch(searchInput)
      fetchUsers(searchInput)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, fetchUsers])

  const openEdit = (u) => {
    setEditUser(u)
    setForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      credits: u.credits ?? 0,
      new_password: '',
    })
  }

  const handleSave = async () => {
    if (!form.name.trim())  { showToast('Name is required', 'error'); return }
    if (!form.email.trim()) { showToast('Email is required', 'error'); return }

    setLoading(true)
    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      credits: Number(form.credits) || 0,
    }
    if (form.new_password.trim()) body.new_password = form.new_password.trim()

    const uid = editUser.id || editUser._id
    const d = await api(`admin/users/${uid}`, { method: 'PUT', body })
    setLoading(false)

    if (d.error) { showToast(d.error, 'error'); return }
    showToast('User updated successfully', 'success')
    setEditUser(null)
    // Update local state
    setUsers(prev => prev.map(u => (u.id || u._id) === uid ? { ...u, ...body } : u))
  }

  const handleDelete = async (id) => {
    setLoading(true)
    const d = await api(`admin/users/${id}`, { method: 'DELETE' })
    setLoading(false)
    setDeleteConfirm(null)
    if (d.error) { showToast(d.error, 'error'); return }
    showToast('User deleted', 'success')
    setUsers(prev => prev.filter(u => (u.id || u._id) !== id))
  }

  // Paginate
  const totalPages = Math.ceil(users.length / PAGE_SIZE)
  const paged = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Customers</h2>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} registered users</p>
        </div>
        <button
          onClick={() => fetchUsers(search)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search by name, email, or phone…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {fetching ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-16">
            <UserCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{search ? 'No users match your search' : 'No customers yet'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Credits</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.map(u => (
                    <tr key={u.id || u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-pink-500 text-xs font-bold">{(u.name?.[0] || 'U').toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700 text-sm">{u.name || '—'}</p>
                            <p className="text-[11px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{u.phone || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                          ${(u.credits || 0) > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Zap className="w-3 h-3" />
                          {u.credits || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                            title="Edit user"
                          >
                            <Pencil className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Delete user"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, users.length)} of {users.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit User Modal ── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Edit Customer</h3>
                  <p className="text-xs text-gray-400">{editUser.email}</p>
                </div>
              </div>
              <button onClick={() => setEditUser(null)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">
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
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="pl-9 h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="pl-9 h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              {/* Credits */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                  AI Credits
                  <span className="ml-1.5 text-gray-400 font-normal">(1 credit = 1 design generation)</span>
                </label>
                <div className="relative">
                  <Zap className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="number"
                    min="0"
                    value={form.credits}
                    onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
                    className="pl-9 h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              {/* Password Reset */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                  Reset Password
                  <span className="ml-1.5 text-gray-400 font-normal">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={form.new_password}
                    onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                    className="pl-9 h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditUser(null)}
                className="flex-1 h-11 rounded-xl border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white border-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
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
                <h3 className="font-bold text-gray-800">Delete Customer?</h3>
                <p className="text-xs text-gray-400">This also deletes all their orders and designs</p>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 mb-5 space-y-1">
              <p className="text-sm font-semibold text-red-700">{deleteConfirm.name}</p>
              <p className="text-xs text-red-500">{deleteConfirm.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <ShoppingBag className="w-3.5 h-3.5 text-red-400" />
                <p className="text-xs text-red-400">All orders and generated designs will be permanently deleted</p>
              </div>
            </div>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Forever'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
