CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES streams(id),
  donor_user_id UUID REFERENCES auth.users(id),
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  message TEXT,
  payment_method VARCHAR(50), -- pix, card, transfer, boleto
  payment_status VARCHAR(50), -- pending, completed, failed, refunded
  payment_id VARCHAR(255), -- ID do gateway (Mercado Pago, Stripe)
  transaction_id VARCHAR(255),
  
  -- Streamer info
  streamer_id UUID NOT NULL REFERENCES auth.users(id),
  streamer_amount DECIMAL(10, 2), -- Valor recebido pelo streamer
  platform_fee DECIMAL(10, 2), -- Taxa da plataforma
  gateway_fee DECIMAL(10, 2), -- Taxa do gateway
  
  -- Visibility
  is_public BOOLEAN DEFAULT true, -- Mostrar no chat/painel
  show_amount BOOLEAN DEFAULT true,
  show_name BOOLEAN DEFAULT true,
  
  -- Receipt
  receipt_sent BOOLEAN DEFAULT false,
  receipt_sent_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  
  UNIQUE(payment_id) -- Evitar duplicatas
);

CREATE TABLE IF NOT EXISTS donation_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  emoji VARCHAR(10),
  color VARCHAR(7),
  alert_message TEXT,
  alert_sound_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(streamer_id, amount)
);

CREATE TABLE IF NOT EXISTS donation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  
  -- Payment methods
  enable_pix BOOLEAN DEFAULT true,
  enable_card BOOLEAN DEFAULT true,
  enable_transfer BOOLEAN DEFAULT true,
  
  -- Fees
  platform_fee_percent DECIMAL(5, 2) DEFAULT 10, -- 10%
  
  -- Notifications
  notify_chat BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  notify_sms BOOLEAN DEFAULT false,
  
  -- Display
  show_top_donators BOOLEAN DEFAULT true,
  top_donators_count INTEGER DEFAULT 5,
  donation_alerts_enabled BOOLEAN DEFAULT true,
  
  -- Payout
  payout_method VARCHAR(50), -- bank_transfer, wallet
  payout_frequency VARCHAR(50), -- instant, daily, weekly, monthly
  min_payout_amount DECIMAL(10, 2) DEFAULT 100,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donation_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id),
  email VARCHAR(255),
  receipt_url VARCHAR(500),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_donations_stream ON donations(stream_id);
CREATE INDEX idx_donations_streamer ON donations(streamer_id);
CREATE INDEX idx_donations_status ON donations(payment_status);
CREATE INDEX idx_donations_created ON donations(created_at);
CREATE INDEX idx_donation_tiers_streamer ON donation_tiers(streamer_id);
