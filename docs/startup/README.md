# Tecida: materiais da startup

1. [Roteiro de entrevistas com RH e liderança](entrevistas-rh.md): validar a dor antes de construir mais.
2. [Memorando de entendimento entre as sócias](acordo-socias.md): modelo para preencher juntas e revisar com advogado.
3. [Textos para editais](supernova.md): Sebrae Supernova e similares.
4. [Do piloto ao produto](produto-multiempresa-lgpd.md): várias empresas, login corporativo, IA com dados reais e LGPD.

A landing page para empresas fica em `/empresas`. Para o botão de contato aparecer, configure `CONTATO_EMAIL` na Vercel e faça um novo deploy.

## Variáveis para a instalação de cada empresa

| Variável | Para quê |
|---|---|
| `NEXT_PUBLIC_EMPRESA_NOME` | Nome da empresa no login e no topo. |
| `PILOT_EMAIL_DOMINIOS` | Domínios de e-mail aceitos, como `empresa.com.br`. Vazio deixa o cadastro aberto. |
| `PILOT_LEADER_EMAILS` | Quem vê o painel da liderança. |
| `CONTATO_EMAIL` | Botão de contato da landing e da política de privacidade. |

Depois de mudar qualquer uma delas na Vercel, faça um novo deploy.

Antes de usar em produção, aplique a migração `supabase/migrations/202610270015_conta_lgpd.sql` no banco (SQL Editor do Supabase). Ela cria a função de exclusão de conta e garante a coluna de texto do chat.
