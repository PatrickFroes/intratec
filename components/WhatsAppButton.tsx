'use client'

import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  phone?: string
  label?: string
  message?: string
  compact?: boolean
  className?: string
}

export function WhatsAppButton({ phone, label, message = '', compact = false, className = '' }: WhatsAppButtonProps) {
  if (!phone) return null

  // Limpa o número (remove caracteres não numéricos)
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Adiciona código do país se não tiver (assumindo Brasil 55)
  // Lógica simples: se tiver 10 ou 11 dígitos, é BR.
  const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone
  
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodedMessage}`

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Previne cliques em cards arrastáveis
    window.open(whatsappUrl, '_blank')
  }

  if (compact) {
    return (
      <button 
        onClick={handleClick}
        className={`bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-full transition-colors flex items-center justify-center shadow-sm ${className}`}
        title={`Conversar no WhatsApp (${phone})`}
      >
        <MessageCircle size={16} fill="white" className="text-white" />
      </button>
    )
  }

  return (
    <button 
      onClick={handleClick}
      className={`flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-all shadow-sm ${className}`}
    >
      <MessageCircle size={18} fill="white" className="text-white" />
      {label || 'WhatsApp'}
    </button>
  )
}
