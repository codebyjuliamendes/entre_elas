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
