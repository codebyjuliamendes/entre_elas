# E-mails de autenticação — Entre Elas

Os HTMLs usam a identidade rosa/coral/roxo/azul do app, wordmark em texto,
ícone PNG, tabelas e estilos inline, sem fontes externas ou scripts.
O ícone é carregado de `{{ .SiteURL }}/icon-192.png`; configure Site URL com a
URL pública do aplicativo. Se o cliente bloquear imagens, o nome e todos os
controles de acesso continuam disponíveis. Funcionam como templates do Supabase Auth.

| Supabase → Authentication → Email Templates | Arquivo | Assunto sugerido |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | Boas-vindas ao Entre Elas ✨ Confirme seu e-mail |
| Magic Link | `magic-link.html` | Seu link para entrar no Entre Elas ✨ |

Copie o HTML completo para cada template e salve. Personalize **os dois**:
`signInWithOtp` com cadastro habilitado pode usar confirmação no primeiro acesso
e Magic Link nos seguintes. Preserve `{{ .ConfirmationURL }}` no botão e no
link alternativo: é o endereço individual gerado pelo Supabase. Não substitua
por `/piloto`, por URL fixa ou por um token de exemplo.

O login mantém PKCE: abrir o link no mesmo navegador/dispositivo da solicitação.
Configure a expiração do Auth em dez minutos, compatível com o cookie temporário.
Os templates não alteram expiração, URLs permitidas ou a política de cadastro.

## Remetente próprio

É possível criar uma caixa como `ola@seudominio.com` ou `contato@seudominio.com`
e usar **Entre Elas** como nome do remetente. O endereço é um exemplo; use um
domínio que você controla. A criação dessa caixa é feita no provedor de e-mail.

No Supabase, configure **Custom SMTP** com o provedor que enviará as mensagens
(por exemplo, Brevo, Resend, SES ou o serviço da sua caixa):

- Nome do remetente: **Entre Elas**.
- Endereço do remetente: a caixa/endereço verificado no provedor.
- Host, porta, usuário e senha SMTP: conforme instruções do provedor, inseridos
  diretamente nas configurações seguras do Supabase. Nunca no Git ou no chat.
- Configure e verifique os registros DNS de SPF/DKIM fornecidos pelo provedor;
  configure DMARC conforme a política do seu domínio. Confira quota e limites.
- Desative rastreamento/regravação de links do provedor para os e-mails de login.

Criar a caixa e editar HTML não configura o SMTP automaticamente. O serviço padrão
de envio do Supabase tem restrições de destinatários/quotas e não deve ser tratado
como envio público já liberado. Para qualquer pessoa receber, configure SMTP
próprio e habilite novos cadastros no Auth. Não é necessário instalar SDK de envio
no app: o Supabase emite e envia os links de autenticação.

Na configuração de URLs do Auth, use a URL pública do app e permita exatamente
`https://SEU-DOMINIO/auth/callback`. A variável APP_URL deve corresponder ao domínio.
Teste primeiro cadastro e acesso recorrente, links expirados, pasta de spam,
renovação e saída no ambiente público. As capturas locais são prévias de navegador;
não comprovam renderização idêntica em Outlook/Gmail nem entrega real.
