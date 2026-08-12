# Referência de esquema obrigatório

> Documento de consulta obrigatória para desenvolvedores que trabalham com vistoriadores, vistorias e o fluxo de respostas.

## Visão geral

Este projeto usa Supabase com o esquema `public` para os dados de vistoria técnica. As tabelas centrais são:

- `public.vistoriadores`
- `public.vistorias`
- `public.vistoria`
- `public.hospitais`
- `public.hospital`
- `public.escopos`
- `public.categorias_checklist`
- `public.requisitos`

> Atenção: `public.vistoria` e `public.vistorias` são tabelas distintas. O app principal usa `public.vistorias` para o fluxo contínuo de vistoria e `public.vistoria` para dados de histórico/relatório legados.

---

## Tabela `public.vistoriadores`

Finalidade: cadastro de vistoriadores que podem ser selecionados durante a vistoria.

Colunas principais:

- `id` bigint PK
- `nome` text NOT NULL
- `funcao` text NOT NULL
- `created_at` timestamptz NOT NULL DEFAULT now()
- `updated_at` timestamptz NOT NULL DEFAULT now()

RLS:

- habilitada em `public.vistoriadores`
- políticas configuradas para `anon` e `authenticated`:
  - `vistoriadores_select_public`
  - `vistoriadores_insert_public`
  - `vistoriadores_update_public`

Índice relevante:

- `idx_vistoriadores_nome`

---

## Tabela `public.vistorias`

Finalidade: fluxo ativo de vistoria contínua com checklist, vistoriador associado e respostas em JSON.

Colunas principais:

- `id` uuid PK DEFAULT gen_random_uuid()
- `local` text NOT NULL DEFAULT 'Hospital Base'
- `vistoriador_id` bigint NULL
- `respostas` jsonb NOT NULL DEFAULT '{}'::jsonb
- `status` text DEFAULT 'em_andamento'
- `finalizada_at` timestamptz NULL
- `created_at` timestamptz NOT NULL DEFAULT now()
- `updated_at` timestamptz NOT NULL DEFAULT now()

Restrições/FKs:

- `vistoriador_id` → `public.vistoriadores(id)`
- `vistorias_status_check` garante valores esperados para `status`
- `respostas` jsonb NOT NULL DEFAULT '{}'::jsonb armazena respostas por requisito diretamente em `public.vistorias`, sem tabela separada.

RLS:

- habilitada em `public.vistorias`
- políticas configuradas para `anon` e `authenticated`:
  - `vistorias_select_public`
  - `vistorias_insert_public`
  - `vistorias_update_public`

Índices relevantes:

- `idx_vistorias_vistoriador`
- `idx_vistorias_status`
- `idx_vistorias_created_at`
- `idx_vistorias_respostas` (GIN)

Fluxo do app:

- Ao selecionar um vistoriador, o app carrega `vistorias` por `activeVistoriaId` salvo em `localStorage`.
- Se não houver vistoria ativa, o app cria uma nova linha em `public.vistorias` com `local`, `vistoriador_id` e `respostas: {}`.
- O campo `respostas` é mantido como JSONB e atualizado em lote sempre que o usuário altera o checklist.
- `VistoriadorExtended` inclui `created_at` e `updated_at` para exibir histórico de cadastro.

---

## Tabela `public.hospitais` vs `public.hospital`

O projeto contém dois modelos de hospital:

- `public.hospitais` é usado principalmente em `public.vistorias` e `public.hospital_escopos`
- `public.hospital` é referenciado por `public.vistoria` via `hospital_id`

Ambos devem ser compreendidos antes de alterar relacionamentos de hospital.

---

## Tabela `public.escopos` e `public.hospital_escopos`

- `public.escopos` armazena escopos de vistoria
- `public.hospital_escopos` relaciona hospitais e escopos

Chaves:

- `hospital_escopos.hospital_id` → `public.hospitais(id)`
- `hospital_escopos.escopo_id` → `public.escopos(id)`

---

## Tabela de checklist e requisitos

- `public.categorias_checklist` contém categorias do checklist
- `public.requisitos` contém requisitos individuais
- `public.requisito` é outro modelo de requisito usado por `public.avaliacao`

Relações importantes:

- `categorias_checklist.escopo_id` → `public.escopos(id)`
- `requisitos.categoria_id` → `public.categorias_checklist(id)`
- `requisito.categoria_id` → `public.categoria(id)`

---

## Armazenamento de fotos da vistoria

Bucket de arquivos:

- `storage.buckets.id = 'fotos_vistorias'`

Políticas de storage:

- `fotos_vistorias_select_public`
- `fotos_vistorias_insert_public`
- `fotos_vistorias_update_public`
- `fotos_vistorias_delete_public`

Todas usam `bucket_id = 'fotos_vistorias'` como condição.

---

## Notas de segurança e consulta obrigatória

- As tabelas `public.vistoriadores`, `public.vistorias` e `public.respostas` têm RLS habilitado e foram configuradas para acesso público controlado.
- `public.vistorias` é o núcleo do aplicativo de vistoria contínua. Antes de alterar qualquer política, valide o impacto em `anon` e `authenticated`.
- `public.vistoria` é um histórico / fluxo adicional, então mudanças em seu relacionamento com `hospital` podem não afetar diretamente o fluxo principal de checklist.

---

## Como usar este documento

1. Consulte este arquivo antes de editar `src/app/page.tsx` ou o domínio de vistoria.
2. Verifique os nomes de tabelas e colunas exatos antes de escrever consultas SQL diretas.
3. Use os nomes de policy e índices para revisar o comportamento de RLS e performance.
