import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface DonationEvent {
    donorName: string;
    amount: number;
    message?: string;
}

export function useDonationNotifications(streamId: string, onDonation: (data: DonationEvent) => void) {
  useEffect(() => {
    if (!streamId) return;

    // Subscribe to donations channel
    const subscription = supabase
      .channel(`donations:stream_id=eq.${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'donations',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          // Trigger apenas quando passa para completed
          if (payload.new.payment_status === 'completed' && payload.old.payment_status !== 'completed') {
            onDonation({
              donorName: payload.new.donor_name,
              amount: Number(payload.new.amount),
              message: payload.new.message,
            })

            // Tocar som de notificação (opcional - precisa de interação do usuário antes no navegador)
            try {
                const audio = new Audio('/sounds/donation.mp3') // Certifique-se que o arquivo existe
                audio.play().catch((e) => console.log('Audio play failed:', e))
            } catch (e) {
                // Ignore audio errors
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          // Caso a doação já venha como completed (menos comum no PIX, mas pode acontecer em outros meios)
          if (payload.new.payment_status === 'completed') {
            onDonation({
              donorName: payload.new.donor_name,
              amount: Number(payload.new.amount),
              message: payload.new.message,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [streamId, onDonation])
}
