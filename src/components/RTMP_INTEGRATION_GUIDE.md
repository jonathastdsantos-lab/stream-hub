# Guia de Integração RTMP — StreamHub

Este guia fornece os passos e exemplos de código para integrar o Gerenciador de Chaves RTMP e seus subcomponentes dentro do StreamHub.

---

## 📂 Estrutura de Arquivos Recomendada

```bash
seu-projeto/
├── src/
│   ├── components/
│   │   ├── RtmpKeyDisplay.tsx         # Componentes base (URL, Key, Cards, Grid)
│   │   ├── RtmpExamples.tsx           # Exemplos prontos de páginas e modais
│   │   └── RtmpKeyManager.tsx         # Gerenciador integrado com FFmpeg
│   ├── pages/
│   │   └── Platforms.tsx              # Página completa de plataformas
│   └── lib/
│       └── supabase.ts                # Cliente do Supabase
```

---

## ⚡ Componentes Disponíveis

| Componente | Função | Quando Usar |
| :--- | :--- | :--- |
| **`RtmpKeyField`** | Campo de texto de leitura com botão de cópia rápida e visibilidade alternável. | Exibir URLs ou chaves individuais. |
| **`RtmpPlatformCard`** | Card expandível estilizado com o tema da plataforma (YouTube, Twitch, Kick, TikTok, Facebook). | Lista detalhada de plataformas individuais com botões de ação (Gerar chave, Desconectar). |
| **`RtmpKeyQuick`** | Display compacto inline contendo servidor e chave de transmissão rápida. | Visualização inline e rápida no Dashboard lateral. |
| **`RtmpGrid`** | Grid responsivo de colunas que organiza os cards de forma elegante. | Página principal de gerenciamento de destinos. |

---

## 🛠️ Exemplo de Uso Rápido (Copy-Paste)

```tsx
import { RtmpPlatformCard } from './components/RtmpKeyDisplay';

function Exemplo() {
  return (
    <RtmpPlatformCard
      platform="youtube"
      connected={true}
      rtmpUrl="rtmps://a.rtmp.youtube.com/a/"
      streamKey="abcd-efgh-ijkl-mnop"
      channelName="Meu Canal no YouTube"
      onFetchKey={() => console.log('Gerar chave para YouTube')}
      onDisconnect={() => console.log('Desconectar YouTube')}
    />
  );
}
```

---

## 🚀 Passos para Integração com Supabase & Edge Functions

### 1. Criar a Edge Function `get-rtmp-key`
Certifique-se de que a sua Edge Function no Supabase está configurada para retornar as credenciais de acordo com a plataforma enviada no body do POST:
```bash
supabase functions deploy get-rtmp-key
```

### 2. Configurar Variáveis de Ambiente no Supabase
Lembre-se de definir as variáveis das APIs correspondentes para que a função consiga gerar as chaves dinamicamente:
```bash
supabase secrets set YOUTUBE_API_KEY="sua_chave" TWITCH_CLIENT_ID="seu_client_id" TWITCH_CLIENT_SECRET="seu_secret"
```

### 3. Integração na Página de Plataformas (`PlatformsPage`)
Utilize a tabela `platform_connections` para carregar o status de conexão de cada plataforma. Ao clicar em **"Gerar Chave"**, execute o invoke da Edge Function `get-rtmp-key` e atualize as colunas `rtmp_url` e `stream_key` no banco de dados.

Para exemplos completos de implementação da página de gerenciamento, modal de OAuth e preview compacto do painel, consulte o arquivo [RtmpExamples.tsx](file:///c:/Users/DELL/Desktop/Projeto/stream-hub/src/components/RtmpExamples.tsx).
