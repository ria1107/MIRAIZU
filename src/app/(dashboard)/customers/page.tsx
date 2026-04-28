'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Customer } from '@/types/database'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

type FormState = { name: string; email: string; phone: string; address: string; notes: string }
const emptyForm: FormState = { name: '', email: '', phone: '', address: '', notes: '' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers')
      if (res.status === 401) { window.location.href = '/login'; return }
      if (!res.ok) { setError('データの取得に失敗しました'); return }
      setCustomers(await res.json())
    } catch { setError('サーバーへの接続に失敗しました') }
    finally { setLoading(false) }
  }

  function startEdit(c: Customer) {
    setEditId(c.id)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '' })
    setShowForm(false)
  }

  function startCreate() {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function cancel() { setShowForm(false); setEditId(null); setForm(emptyForm) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editId ? `/api/customers/${editId}` : '/api/customers'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { setError('保存に失敗しました'); return }
      await fetchCustomers()
      cancel()
    } catch { setError('保存に失敗しました') }
    finally { setSaving(false) }
  }

  async function deleteCustomer(id: string) {
    if (!confirm('この顧客を削除しますか？')) return
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    if (res.ok) setCustomers(prev => prev.filter(c => c.id !== id))
    else setError('削除に失敗しました')
  }

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">顧客管理</h2>
          <p className="text-sm text-gray-500 mt-1">{customers.length}件</p>
        </div>
        <Button onClick={startCreate}><Plus className="w-4 h-4 mr-1" />顧客を追加</Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {(showForm || editId) && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">{editId ? '顧客を編集' : '新規顧客'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">顧客名 <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="株式会社〇〇" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              <Check className="w-4 h-4 mr-1" />{saving ? '保存中...' : '保存'}
            </Button>
            <Button variant="outline" onClick={cancel}><X className="w-4 h-4 mr-1" />キャンセル</Button>
          </div>
        </Card>
      )}

      {customers.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">顧客がまだ登録されていません</p>
            <p className="text-sm mt-1">「顧客を追加」から登録してください</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">顧客名</th>
                  <th className="pb-3 font-medium">メール</th>
                  <th className="pb-3 font-medium">電話</th>
                  <th className="pb-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="py-3 text-gray-600">{c.email || '—'}</td>
                    <td className="py-3 text-gray-600">{c.phone || '—'}</td>
                    <td className="py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => startEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCustomer(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
