'use client'

import { useState, useEffect } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { Save, Link as LinkIcon, Unlink, Copy, Check, RefreshCw, HardDrive, ExternalLink, FolderOpen } from 'lucide-react'

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

  // Google Drive連携
  const [driveConnected, setDriveConnected] = useState(false)
  const [driveFolder, setDriveFolder] = useState<{ name: string; url: string } | null>(null)
  const [driveUploadedCount, setDriveUploadedCount] = useState(0)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveTesting, setDriveTesting] = useState(false)
  const [driveTestResult, setDriveTestResult] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, lineRes, driveRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/line/connect'),
          fetch('/api/drive/status'),
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
          if (!data.connected && data.message) setDriveError(data.message)
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

  const handleDriveTest = async () => {
    setDriveTesting(true)
    setDriveTestResult(null)
    try {
      const res = await fetch('/api/drive/status', { method: 'POST' })
      const data = await res.json()
      setDriveTestResult(data.success ? 'success' : `error: ${data.message}`)
    } catch (e) {
      setDriveTestResult('error: テスト中にエラーが発生しました')
      console.error('Driveテストエラー:', e)
    } finally {
      setDriveTesting(false)
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 text-sm mb-2">連携手順</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>下のボタンで連携コードを発行</li>
                  <li>LINEで「MIRAIZU」を友だち追加</li>
                  <li>発行された6桁のコードをLINEで送信</li>
                </ol>
              </div>

              {connectCode ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
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
          )}
        </div>
      </Card>

      {/* Google Drive連携 */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Google Drive連携</CardTitle>
          {driveConnected && <Badge variant="success">接続済み</Badge>}
        </div>
        <div className="mt-4">
          {driveConnected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Google Drive接続中</strong> — LINEから送信された領収書画像が自動保存されます。
                </p>
                {driveFolder && (
                  <div className="mt-2 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">保存先: {driveFolder.name}</span>
                    {driveFolder.url && (
                      <a href={driveFolder.url} target="_blank" rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-500">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
                <p className="text-xs text-green-600 mt-1">
                  アップロード済み: {driveUploadedCount}件
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleDriveTest} disabled={driveTesting}>
                  <HardDrive className="w-4 h-4 mr-1" />{driveTesting ? 'テスト中...' : '接続テスト'}
                </Button>
                {driveTestResult && (
                  <span className={`text-sm ${driveTestResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {driveTestResult === 'success' ? '接続OK' : driveTestResult}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                解析済みの領収書画像をGoogle Driveに自動保存します。
              </p>
              {driveError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">{driveError}</p>
                  <div className="mt-3 bg-white border border-yellow-100 rounded p-3">
                    <h4 className="font-medium text-yellow-900 text-sm mb-2">セットアップ手順</h4>
                    <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
                      <li>Google Cloud Consoleでプロジェクトを作成</li>
                      <li>Google Drive APIを有効化</li>
                      <li>サービスアカウントを作成・鍵をダウンロード</li>
                      <li>Google Driveで保存先フォルダを作成</li>
                      <li>フォルダをサービスアカウントと共有</li>
                      <li>環境変数を設定（Vercel）</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Google Driveの接続状態を確認中...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
