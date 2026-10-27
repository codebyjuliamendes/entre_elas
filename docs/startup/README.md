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
| `NEXT_PUBLIC_EMPRESA_LOGO` | Logo da empresa: arquivo em `public/` (ex.: `/clientes/empresa.svg`) ou endereço `https://`. |
| `NEXT_PUBLIC_EMPRESA_AREAS` | Áreas da empresa, separadas por vírgula. Viram sugestões no perfil. |
| `NEXT_PUBLIC_EMPRESA_REGIONAIS` | Regionais, separadas por vírgula. Viram sugestões no perfil. |
| `NEXT_PUBLIC_LOGIN_SSO` | Login corporativo: `azure` (Microsoft), `google` ou os dois, separados por vírgula. Vazio desliga. |

Depois de mudar qualquer uma delas na Vercel, faça um novo deploy.

Antes de usar em produção, aplique a migração `supabase/migrations/202610270015_conta_lgpd.sql` no banco (SQL Editor do Supabase). Ela cria a função de exclusão de conta e garante a coluna de texto do chat.

## Ligar o login com Microsoft ou Google

1. No Supabase: **Authentication → Sign In / Providers**. Ative **Azure** (Microsoft) ou **Google** e cole o *Client ID* e o *Secret* criados no portal do provedor (Microsoft Entra ou Google Cloud). O endereço de retorno que o provedor pede aparece nessa mesma tela.
2. Em **Authentication → URL Configuration**, inclua `https://SEU-DOMINIO/auth/callback` nas URLs de redirecionamento.
3. Na Vercel: `NEXT_PUBLIC_LOGIN_SSO=azure` (ou `google`, ou `azure,google`) e um novo deploy.
4. Use junto com `PILOT_EMAIL_DOMINIOS`: quem entrar com uma conta de outro domínio volta para o login, sem acesso.

Na primeira entrada por Microsoft ou Google, a conta do piloto é criada automaticamente. Clicar no botão é a escolha de entrar.
