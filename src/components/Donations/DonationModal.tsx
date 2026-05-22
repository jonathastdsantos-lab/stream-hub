import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface Props {
  streamId: string
  streamerName: string
  onClose: () => void
}

export function DonationModal({ streamId, streamerName, onClose }: Props) {
  const [amount, setAmount] = useState<number>(10)
  const [message, setMessage] = useState<string>('')
  const [donorName, setDonorName] = useState<string>('')
  const [donorEmail, setDonorEmail] = useState<string>('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [qrCodeCopy, setQrCodeCopy] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>('pending')

  const presets = [10, 20, 50, 100]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()

      const { data, error: createError } = await supabase.functions.invoke(
        'create-donation',
        {
          body: {
            streamId,
            amount,
            donorName: isAnonymous ? 'Anônimo' : donorName,
            donorEmail,
            message,
            paymentMethod: 'pix',
            isAnonymous,
          },
          headers: sessionData?.session?.access_token ? {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          } : undefined,
        }
      )

      if (createError) throw createError

      if (data.qrCodeBase64 || data.qrCode) {
        setQrCodeBase64(data.qrCodeBase64)
        setQrCodeCopy(data.qrCode) // O código "Copia e Cola"
        setPaymentId(data.paymentId)
        
        // Polling simples para verificar o status
        const interval = setInterval(async () => {
          const { data: donationData } = await supabase
            .from('donations')
            .select('payment_status')
            .eq('payment_id', data.paymentId)
            .single()
            
          if (donationData && donationData.payment_status === 'completed') {
            setPaymentStatus('completed')
            clearInterval(interval)
            setTimeout(() => {
                onClose()
            }, 3000)
          }
        }, 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar doação')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
      if (qrCodeCopy) {
          navigator.clipboard.writeText(qrCodeCopy);
          alert('Código PIX copiado!');
      }
  }

  if (paymentStatus === 'completed') {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
                <h3 className="text-2xl font-bold mb-4 text-green-600">Doação Confirmada! 🎉</h3>
                <p className="text-gray-700">Muito obrigado pelo seu apoio.</p>
            </div>
        </div>
      )
  }

  if (qrCodeBase64 || qrCodeCopy) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4 text-center">Escaneie para Pagar com PIX</h3>

          {qrCodeBase64 && (
              <div className="bg-gray-100 p-4 rounded mb-4 flex justify-center">
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>
          )}

          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-green-600">
              R$ {amount.toFixed(2)}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              A doação será creditada assim que o PIX for confirmado
            </p>
          </div>
          
          {qrCodeCopy && (
              <button 
                onClick={handleCopy}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded font-semibold mb-4 border border-blue-300"
              >
                  Copiar Código PIX (Copia e Cola)
              </button>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full my-8">
        <h2 className="text-2xl font-bold mb-6">Apoiar {streamerName}</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold mb-2">Valor (R$)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="1"
              step="0.01"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
            <div className="flex gap-2 mt-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm font-semibold transition"
                >
                  R$ {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous */}
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
              Doação anônima
            </label>
          </div>

          {/* Donor Name */}
          {!isAnonymous && (
            <div>
              <label className="block text-sm font-semibold mb-2">Seu Nome</label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                required={!isAnonymous}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Mensagem (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              className="w-full border border-gray-300 rounded px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Envie uma mensagem ao streamer..."
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {message.length}/200
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded font-semibold transition"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2.5 rounded font-semibold transition flex justify-center items-center"
              disabled={isLoading || amount < 1}
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                `Doar R$ ${amount.toFixed(2)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
