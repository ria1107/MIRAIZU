import Link from 'next/link'
import { Camera, Brain, BarChart3, MessageCircle, Shield, Zap } from 'lucide-react'

const features = [
  { icon: Camera, title: 'LINEで撮るだけ', description: '領収書を写真で送るだけ。動画での一括スキャンにも対応。' },
  { icon: Brain, title: 'AI自動解析', description: 'GPT-4oが金額・日付・取引先・勘定科目を自動で読み取り。' },
  { icon: BarChart3, title: '財務ダッシュボード', description: '売上・経費・利益がグラフで一目瞭然。経営判断をサポート。' },
  { icon: MessageCircle, title: 'LINE通知', description: '解析結果や月次レポートをLINEでお知らせ。' },
  { icon: Shield, title: 'Google Drive保存', description: '証憑をクラウドに自動保存。電子帳簿保存法にも対応準備。' },
  { icon: Zap, title: '自動仕訳', description: '「この店ならこの科目」をAIが学習。入力の手間をゼロに。' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">MIRAIZU</h1>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">ログイン</Link>
            <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          LINEで領収書を送るだけ。<br />
          <span className="text-blue-600">AIが経理を自動化。</span>
        </h2>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          写真を撮って送信するだけで、AIが金額・日付・勘定科目を自動解析。
          面倒な経費精算から解放され、経営の数字に集中できます。
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup" className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-lg">
            無料で始める
          </Link>
          <Link href="/login" className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-lg">
            ログイン
          </Link>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">主な機能</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h4>
                <p className="text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">使い方はかんたん3ステップ</h3>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              { step: '1', title: 'LINEで友だち追加', desc: 'QRコードを読み取るだけ。' },
              { step: '2', title: '領収書を撮影・送信', desc: '写真を送るだけでOK。' },
              { step: '3', title: '自動で解析・仕訳', desc: 'AIが全て処理します。' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  {s.step}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mt-4">{s.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; 2025 MIRAIZU. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
