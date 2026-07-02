'use client'

import { useAppStore } from '@/lib/store'
import { useState } from 'react'
import { Lock, Mail, ArrowRight, ShoppingBag, Building2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAppStore()
  const [email, setEmail] = useState('joao@shopping.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const ok = await login(email.trim().toLowerCase(), password.trim())

      if (ok) {
        // Redirecionamento handled pelo useEffect
      } else {
        setError('Credenciais inválidas. Tente novamente.')
      }
    } catch (err) {
      console.error(err)
      setError('Erro ao tentar fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex flex-col justify-center items-center p-8 bg-white lg:p-16 xl:p-24 relative">
        <div className="w-full max-w-md mx-auto space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-10">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">Shopping Intranet</span>
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bem-vindo de volta!</h1>
                <p className="text-slate-500">Insira suas credenciais para acessar o painel.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email Institucional</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                             <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field pl-10"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-sm font-semibold text-slate-700">Senha</label>
                        <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Esqueceu a senha?</a>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                             <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field pl-10"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2 animated pulse">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base shadow-blue-500/20"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>Inciar Sessão <ArrowRight size={18} /></>
                    )}
                </button>
            </form>

            <div className="pt-6 text-center text-sm text-slate-400">
                <p>Problemas com acesso? <a href="#" className="text-slate-600 font-medium underline decoration-slate-300 underline-offset-4 hover:text-blue-600">Contate o suporte</a></p>
            </div>
        </div>

        <div className="absolute bottom-6 text-xs text-slate-300">
            &copy; 2026 Shopping Intranet System v1.5
        </div>
      </div>

      {/* Right Column - Decorative */}
      <div className="hidden lg:block relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-900/90 mix-blend-multiply z-10" />
        {/* Placeholder for an actual image if we had one, for now utilizing CSS pattern */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
                 backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', 
                 backgroundSize: '30px 30px' 
             }}>
        </div>
        
        <div className="relative z-20 h-full flex flex-col justify-center px-16 text-white space-y-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                <Building2 size={32} />
            </div>
            <h2 className="text-4xl font-bold leading-tight max-w-lg">
                Gerencie todos os seus empreendimentos em um só lugar.
            </h2>
            <p className="text-lg text-blue-100 max-w-md leading-relaxed">
                Plataforma integrada para gestão de lojas, contratos, manutenção e segurança patrimonial.
            </p>

            <div className="pt-8 flex gap-4">
                <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 w-fit">
                    <p className="text-3xl font-bold">12</p>
                    <p className="text-xs text-blue-200 uppercase tracking-wider mt-1">Shoppings</p>
                </div>
                 <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 w-fit">
                    <p className="text-3xl font-bold">1.5k+</p>
                    <p className="text-xs text-blue-200 uppercase tracking-wider mt-1">Lojas Ativas</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
