# Decisões

- 2026-10-14: Next.js com App Router, React, Zod, Vitest, ESLint, Supabase e SDK servidor do Stream; `tsx` executa scripts TypeScript e a CLI Supabase gera tipos e aplica migrations. Não há bibliotecas de IA: Gemini, Groq e Daily usam fetch nativo com TLS.
- 2026-10-14: O modelo de dados usa os nomes de tabelas especificados no contrato original, mesmo quando estão em inglês; colunas e novos objetos são em português sem acentos.
- 2026-10-14: Embeddings Gemini fixados em gemini-embedding-001 e 768 dimensões, com normalização; alterar modelo ou dimensão exige migration e reprocessamento integral.
- 2026-10-14: Cookie de demo assinado no servidor; endpoints de demo exigem DEMO_MODE=true. SSO e controle de acesso administrativo real ficam para a integração futura.
- 2026-10-14: Integrações e processamento de IA usam fila persistente e retentativas explícitas. Falhas de integração não desfazem o aceite da Faísca.
- 2026-10-14: A busca vetorial filtra saberes não confirmados e conteúdo privado antes do ranqueamento; conteúdo privado não contribui para sugestões públicas.
- 2026-10-14: Testes usam provedores simulados; scripts de demonstração usam somente dados fictícios e serviços reais configurados. Nenhuma credencial é inventada.

- 2026-10-14: A pilha Docker completa do Supabase excedeu o espaço disponível. Desenvolvimento e testes locais usam pgvector/Postgres 17 e PostgREST 14 com um adaptador de prefixo REST; não simulam Storage/Auth. Migrations são aplicadas atomicamente e seus hashes impedem reaplicar arquivos alterados. O ambiente hospedado continua usando Supabase.
- 2026-10-14: A CLI Supabase 2.75.0 foi fixada porque a versão mais recente escreve num diretório pessoal somente leitura. A instalação usa o proxy npm e mantém a verificação de checksum oficial.
- 2026-10-14: Resumos alimentam a extração como contexto; a evidência continua sendo trecho literal das anotações de cada autora, evitando atribuir a uma participante saberes demonstrados apenas pela outra.
- 2026-10-14: O bucket privado fotos-perfil é criado apenas quando o schema Storage está disponível; upload aceita JPEG/PNG/WebP até 5 MiB, com acesso servidor. Essa migration precisa de validação adicional no Supabase hospedado.
- 2026-10-14: Override de tar atualizado para a versão corrigida, mantendo a verificação de artefatos da CLI.
- 2026-10-14: Embeddings são normalizados e cacheados por hash de texto, modelo e dimensão; isso reduz chamadas na repetição da demo sem misturar modelos.
- 2026-10-14: O npm audit não encontrou vulnerabilidades nas dependências de produção. Há alertas de desenvolvimento na cadeia de glob do ESLint, sem versão corrigida disponível de braces; não foi aplicado downgrade incompatível de Next.js para ocultar o alerta.
- 2026-10-14: agentRules=false impede o Next dev de acrescentar instruções automáticas ao AGENTS.md fornecido pela usuária; o documento original é preservado.

- 2026-10-15: A usuária autorizou telas e estilos do MVP e escolheu manter Next.js 16/React 19. O AGENTS.md foi atualizado para refletir esse novo escopo.
- 2026-10-15: Tailwind/PostCSS para tema e layout; Framer Motion para transições com reduced-motion; Radix Slot/Dialog/Tabs, class-variance-authority, clsx e tailwind-merge compõem os componentes no padrão shadcn/ui; Lucide fornece ícones e Sonner feedback acessível.
- 2026-10-15: Vercel AI SDK e @ai-sdk/openai-compatible habilitam Llama via OpenRouter nas Server Actions de apresentação. PITCH_AI_MODE=demo funciona sem chaves; live exige OPENROUTER_API_KEY e um modelo disponível na conta. Toda chamada tem deadline de 7,5 s, sem retries automáticos, validação Zod e fallback fictício identificado.
- 2026-10-15: Playwright verifica a jornada em navegador, persistência, autorizações, quiz e navegação. Avatares SVG fictícios e fontes locais do sistema evitam dependências de rede no pitch e no build.
- 2026-10-15: A camada visual é uma apresentação funcional com dados locais, login e chamada simulados. localStorage armazena apenas dados de demonstração; o backend real continua independente. Mensagens simuladas não vão para Stream/IA; mensagens reais continuam exclusivas do Stream.
- 2026-10-15: O schema existente é mais completo que o compacto solicitado no novo template. Preservamos suas migrations, nomes (communities/foto_url) e vetores 768 compatíveis com Gemini, em vez de recriar tabelas e misturar vetores 384. supabase/seed/mvp.sql entrega três perfis/saberes idempotentes sem fabricar embeddings.
- 2026-10-15: O servidor Turbopack previamente ativo ficou preso durante a atualização de dependências e não encerrou normalmente. Desenvolvimento usa Webpack, como o build de produção já validado; o processo anterior foi encerrado e a inicialização foi testada novamente.
