import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface Earning {
  total: number
  pending: number
  completed: number
  topDonators: Array<{ name: string; amount: number; count: number }>
  recentDonations: Array<{
    id: string
    donorName: string
    amount: number
    createdAt: string
  }>
}

export function EarningsTab() {
  const [earnings, setEarnings] = useState<Earning | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  useEffect(() => {
    const fetchEarnings = async () => {
      setIsLoading(true)
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData?.session?.user) return

        // Get total donations
        const { data: donations } = await supabase
          .from('donations')
          .select('id, amount, payment_status, donor_name, created_at')
          .eq('streamer_id', sessionData.session.user.id)
          .gte('created_at', getDateFrom(selectedPeriod))
          .order('created_at', { ascending: false })

        if (!donations) return

        const total = donations.reduce((sum, d) => sum + Number(d.amount), 0)
        const pending = donations
          .filter((d) => d.payment_status === 'pending')
          .reduce((sum, d) => sum + Number(d.amount), 0)
        const completed = donations
          .filter((d) => d.payment_status === 'completed')
          .reduce((sum, d) => sum + Number(d.amount), 0)

        // Get top donators (only completed)
        const completedDonations = donations.filter((d) => d.payment_status === 'completed')
        
        const topDonators = completedDonations
          .reduce(
            (acc, d) => {
              const existing = acc.find((x) => x.name === d.donor_name)
              if (existing) {
                existing.amount += Number(d.amount)
                existing.count++
              } else {
                acc.push({ name: d.donor_name, amount: Number(d.amount), count: 1 })
              }
              return acc
            },
            [] as Array<{ name: string; amount: number; count: number }>
          )
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        setEarnings({
          total,
          pending,
          completed,
          topDonators,
          recentDonations: completedDonations.slice(0, 10).map(d => ({
              id: d.id,
              donorName: d.donor_name,
              amount: Number(d.amount),
              createdAt: d.created_at
          })),
        })
      } catch (error) {
          console.error("Error fetching earnings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEarnings()
  }, [selectedPeriod])

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Carregando métricas...</div>
  }

  if (!earnings) {
    return <div className="text-center py-8 text-gray-500">Nenhuma doação encontrada</div>
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['week', 'month', 'year', 'all'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-full font-medium transition text-sm whitespace-nowrap ${
              selectedPeriod === period
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period === 'week'
              ? 'Última Semana'
              : period === 'month'
                ? 'Este Mês'
                : period === 'year'
                  ? 'Este Ano'
                  : 'Tudo'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Recebido</p>
          <p className="text-3xl font-bold text-green-600">
            R$ {earnings.completed.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Pendente</p>
          <p className="text-3xl font-bold text-yellow-600">
            R$ {earnings.pending.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Bruto</p>
          <p className="text-3xl font-bold text-blue-600">
            R$ {earnings.total.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Donators */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🏆</span> Top Doadores
            </h3>
            {earnings.topDonators.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum doador no período selecionado.</p>
            ) : (
                <div className="space-y-3">
                {earnings.topDonators.map((donator, index) => (
                    <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                    <div>
                        <p className="font-semibold text-gray-900">
                        {index + 1}. {donator.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                        {donator.count} doação(ões)
                        </p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                        R$ {donator.amount.toFixed(2)}
                    </p>
                    </div>
                ))}
                </div>
            )}
          </div>

          {/* Recent Donations */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>💚</span> Doações Recentes
            </h3>
            {earnings.recentDonations.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma doação recebida ainda.</p>
            ) : (
                <div className="space-y-3">
                {earnings.recentDonations.map((donation) => (
                    <div
                    key={donation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                    <div>
                        <p className="font-semibold text-gray-900">{donation.donorName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(donation.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                        </p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                        R$ {donation.amount.toFixed(2)}
                    </p>
                    </div>
                ))}
                </div>
            )}
          </div>
      </div>

      {/* Payout Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h3 className="text-lg font-bold mb-1 text-blue-900 flex items-center gap-2">
                <span>💳</span> Sacar Ganhos
            </h3>
            <p className="text-blue-800 text-sm">
            Saldo disponível: <strong className="text-lg">R$ {earnings.completed.toFixed(2)}</strong>
            </p>
        </div>
        <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition shadow-sm whitespace-nowrap"
            disabled={earnings.completed <= 0}
            onClick={() => alert('Funcionalidade de saque em desenvolvimento.')}
        >
          Solicitar Saque
        </button>
      </div>
    </div>
  )
}

function getDateFrom(period: string): string {
  const now = new Date()
  const date = new Date(now)

  switch (period) {
    case 'week':
      date.setDate(date.getDate() - 7)
      break
    case 'month':
      date.setMonth(date.getMonth() - 1)
      break
    case 'year':
      date.setFullYear(date.getFullYear() - 1)
      break
    case 'all':
      date.setFullYear(2000) // Longe o suficiente
      break
  }

  return date.toISOString()
}
