'use client'

import { useState, useEffect } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { Save, Link as LinkIcon, Unlink, Copy, Check, RefreshCw, ExternalLink, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { SaleItem } from '@/types/database'

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    display_name: '',
    company_name: '',
    email: '',
    fiscal_year_start: '4',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // LINE連携
  const [lineConnected, setLineConnected] = useState(false)
  const [lineConnection, setLineConnection] = useState<{ display_name: string; connected_at: string } | null>(null)
  const [connectCode, setConnectCode] = useState<string | null>(null)
  const [codeExpiry, setCodeExpiry] = useState<string | null>(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // 売上項目
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [addingItem, setAddingItem] = useState(false)

  // Google Drive連携
  const [driveConnected, setDriveConnected] = useState(false)
  const [driveFolder, setDriveFolder] = useState<{ id: string | null; url: string | null } | null>(null)
  const [driveUploadedCount, setDriveUploadedCount] = useState(0)
  const [driveConnectedAt, setDriveConnectedAt] = useState<string | null>(null)
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveDisconnecting, setDriveDisconnecting] = useState(false)
  const [driveMessage, setDriveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, lineRes, driveRes, saleItemsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/line/connect'),
          fetch('/api/drive/status'),
          fetch('/api/sale-items'),
        ])

        if (profileRes.status === 401) {
          window.location.href = '/login'
          return
        }

        if (profileRes.ok) {
          const { profile: p, email } = await profileRes.json()
          if (p) {
            setProfile({
              display_name: p.display_name || '',
              company_name: p.company_name || '',
              email: email || p.email || '',
              fiscal_year_start: String(p.fiscal_year_start || 4),
            })
          }
        }

        if (lineRes.ok) {
          const data = await lineRes.json()
          setLineConnected(data.connected)
          setLineConnection(data.connection || null)
        }

        if (driveRes.ok) {
          const data = await driveRes.json()
          setDriveConnected(data.connected)
          if (data.folder) setDriveFolder(data.folder)
          if (data.uploadedCount !== undefined) setDriveUploadedCount(data.uploadedCount)
          if (data.connectedAt) setDriveConnectedAt(data.connectedAt)
        }

        if (saleItemsRes.ok) setSaleItems(await saleItemsRes.json())

        // URLパラメータでOAuth結果を表示
        const params = new URLSearchParams(window.location.search)
        if (params.get('success') === 'google_connected') {
          setDriveMessage({ type: 'success', text: 'Google Driveの連携が完了しました！' })
          window.history.replaceState({}, '', '/settings')
        } else if (params.get('error')) {
          setDriveMessage({ type: 'error', text: 'Google Driveの連携に失敗しました。もう一度お試しください。' })
          window.history.replaceState({}, '', '/settings')
        }
      } catch (e) {
        console.error('データ取得エラー:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        setSaveMessage('保存しました')
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage('保存に失敗しました')
      }
    } catch {
      setSaveMessage('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateCode = async () => {
    setGeneratingCode(true)
    setCopied(false)
    try {
      const res = await fetch('/api/line/connect', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setConnectCode(data.code)
        setCodeExpiry(data.expiresAt)
      }
    } catch (e) {
      console.error('コード生成エラー:', e)
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleCopyCode = () => {
    if (connectCode) {
      navigator.clipboard.writeText(connectCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('LINE連携を解除しますか？')) return
    setDisconnecting(true)
    try {
      const res = await fetch('/api/line/connect', { method: 'DELETE' })
      if (res.ok) {
        setLineConnected(false)
        setLineConnection(null)
      }
    } catch (e) {
      console.error('連携解除エラー:', e)
    } finally {
      setDisconnecting(false)
    }
  }

  const handleAddSaleItem = async () => {
    if (!newItemName.trim()) return
    setAddingItem(true)
    try {
      const res = await fetch('/api/sale-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName.trim(), default_price: newItemPrice ? Number(newItemPrice) : null }),
      })
      if (res.ok) {
        const item = await res.json()
        setSaleItems(prev => [...prev, item])
        setNewItemName('')
        setNewItemPrice('')
      }
    } catch (e) { console.error('売上項目追加エラー:', e) }
    finally { setAddingItem(false) }
  }

  const handleDeleteSaleItem = async (id: string) => {
    const res = await fetch(`/api/sale-items/${id}`, { method: 'DELETE' })
    if (res.ok) setSaleItems(prev => prev.filter(i => i.id !== id))
  }

  const handleDriveConnect = () => {
    setDriveLoading(true)
    window.location.href = '/api/auth/google'
  }

  const handleDriveDisconnect = async () => {
    if (!confirm('Google Drive連携を解除しますか？\n今後LINEから送った領収書画像はDriveに保存されなくなります。')) return
    setDriveDisconnecting(true)
    try {
      const res = await fetch('/api/drive/status', { method: 'DELETE' })
      if (res.ok) {
        setDriveConnected(false)
        setDriveFolder(null)
        setDriveConnectedAt(null)
        setDriveUploadedCount(0)
        setDriveMessage({ type: 'success', text: 'Google Drive連携を解除しました' })
        setTimeout(() => setDriveMessage(null), 4000)
      }
    } catch (e) {
      console.error('Drive切断エラー:', e)
    } finally {
      setDriveDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">設定</h2>

      {/* プロフィール */}
      <Card>
        <CardTitle>プロフィール</CardTitle>
        <div className="mt-4 space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
            <input name="display_name" value={profile.display_name} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会社名・屋号</label>
            <input name="company_name" value={profile.company_name} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input name="email" value={profile.email} disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">決算開始月</label>
            <select name="fiscal_year_start" value={profile.fiscal_year_start} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}月</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />{saving ? '保存中...' : '保存'}
            </Button>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('失敗') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* LINE連携 */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>LINE連携</CardTitle>
          {lineConnected && <Badge variant="success">連携済み</Badge>}
        </div>
        <div className="mt-4">
          {lineConnected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>LINE連携中</strong> — LINEから領収書画像を送信すると自動解析されます。
                </p>
                {lineConnection?.connected_at && (
                  <p className="text-xs text-green-600 mt-1">
                    連携日: {new Date(lineConnection.connected_at).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={handleDisconnect} disabled={disconnecting}>
                <Unlink className="w-4 h-4 mr-1" />{disconnecting ? '解除中...' : '連携を解除'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                LINEアカウントを連携すると、LINEから領収書画像を送信して自動解析できます。
              </p>

              {/* STEP 1: 友だち追加 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 text-sm mb-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full mr-2">1</span>
                  MIRAIZUを友だち追加
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID ? (
                    <>
                      {/* QRコード */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID}`)}`}
                        alt="LINE友だち追加QRコード"
                        className="w-28 h-28 border border-gray-200 rounded-lg"
                      />
                      <div className="space-y-2">
                        <p className="text-sm text-blue-800">QRコードを読み取るか、ボタンをタップして友だち追加してください。</p>
                        <a
                          href={`https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#06C755] text-white text-sm font-medium rounded-lg hover:bg-[#05b34d] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          LINEで友だち追加
                        </a>
                        <p className="text-xs text-blue-600">Basic ID: {process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-blue-800">
                      LINEで「<strong>MIRAIZU</strong>」を検索して友だち追加してください。
                    </p>
                  )}
                </div>
              </div>

              {/* STEP 2: 連携コード発行 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 text-sm mb-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-600 text-white text-xs rounded-full mr-2">2</span>
                  連携コードを発行してLINEで送信
                </h4>
                {connectCode ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">連携コード（10分間有効）</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-3xl font-mono font-bold tracking-widest text-gray-900">{connectCode}</span>
                      <button onClick={handleCopyCode} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-500" />}
                      </button>
                    </div>
                    {codeExpiry && (
                      <p className="text-xs text-gray-500 mt-2">
                        有効期限: {new Date(codeExpiry).toLocaleTimeString('ja-JP')}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-3">このコードをMIRAIZUのLINEチャットに送信してください。</p>
                    <button onClick={handleGenerateCode} className="mt-3 text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1 mx-auto">
                      <RefreshCw className="w-3 h-3" />新しいコードを発行
                    </button>
                  </div>
                ) : (
                  <Button onClick={handleGenerateCode} disabled={generatingCode}>
                    <LinkIcon className="w-4 h-4 mr-1" />{generatingCode ? 'コード生成中...' : '連携コードを発行'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 売上項目 */}
      <Card>
        <CardTitle>売上項目</CardTitle>
        <p className="text-sm text-gray-500 mt-1">LINEから売上登録する際に選択肢として表示されます</p>
        <div className="mt-4 space-y-3">
          {saleItems.length > 0 && (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {saleItems.map(item => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    {item.default_price && (
                      <span className="ml-2 text-sm text-gray-500">¥{item.default_price.toLocaleString()}</span>
                    )}
                  </div>
                  <button onClick={() => handleDeleteSaleItem(item.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={newItemName} onChange={e => setNewItemName(e.target.value)}
              placeholder="項目名（例: コンサルティング）"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleAddSaleItem()} />
            <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
              placeholder="デフォルト金額"
              className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            <Button onClick={handleAddSaleItem} disabled={addingItem || !newItemName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Google Drive連携 */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Google Drive連携</CardTitle>
          {driveConnected && <Badge variant="success">連携済み</Badge>}
        </div>
        <div className="mt-4">
          {driveMessage && (
            <div className={`mb-4 rounded-lg p-3 text-sm ${driveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {driveMessage.text}
            </div>
          )}
          {driveConnected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Google Drive連携中</strong> — LINEから送信した領収書画像が自動でDriveに保存されます。
                </p>
                {driveFolder?.url && (
                  <div className="mt-2 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-sm text-green-700">保存先: MIRAIZU_領収書</span>
                    <a href={driveFolder.url} target="_blank" rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-500 flex items-center gap-0.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-xs">Driveで開く</span>
                    </a>
                  </div>
                )}
                <div className="mt-1 flex gap-4 text-xs text-green-600">
                  {driveConnectedAt && (
                    <span>連携日: {new Date(driveConnectedAt).toLocaleDateString('ja-JP')}</span>
                  )}
                  <span>保存済み: {driveUploadedCount}件</span>
                </div>
              </div>
              <Button variant="outline" onClick={handleDriveDisconnect} disabled={driveDisconnecting}>
                <Unlink className="w-4 h-4 mr-1" />{driveDisconnecting ? '解除中...' : '連携を解除'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Googleアカウントを連携すると、LINEから送った領収書画像が自動でご自身のGoogle Driveの「MIRAIZU_領収書」フォルダに保存されます。
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 text-sm mb-2">連携後の動作</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>LINE送信の領収書画像が自動でDriveに保存</li>
                  <li>「MIRAIZU_領収書」フォルダが自動作成されます</li>
                  <li>ファイル名: 日付_取引先名.jpg 形式</li>
                </ul>
              </div>
              <Button onClick={handleDriveConnect} disabled={driveLoading}>
                <LinkIcon className="w-4 h-4 mr-1" />
                {driveLoading ? '移動中...' : 'Googleアカウントで連携'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
