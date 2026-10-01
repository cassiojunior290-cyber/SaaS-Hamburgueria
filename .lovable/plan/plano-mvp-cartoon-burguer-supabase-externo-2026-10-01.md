# Plano — MVP CARTOON BURGUER (Supabase externo)

Escopo exato do briefing: cardápio + carrinho + checkout, "Meus pedidos", admin de pedidos/categorias/produtos/loja. Sem pagamentos online, WhatsApp, relatórios, impressora, notificações ou multi-tenant.

## Decisões confirmadas
- Cliente acessa com login e-mail/senha; "Meus pedidos" atrelado à conta.
- Admin: conta já criada — cassiojunior290@gmail.com como **super admin**. Estrutura de papéis (super admin / admin) já permite cadastrar sub-admins no futuro, mas essa gestão será implementada só quando você pedir.
- Imagens de produto: upload de arquivo OU colar URL.
- Visual amarelo e preto, moderno e limpo (imagens anexadas servem só de referência de layout).
- Cardápio inicia com categorias e produtos de exemplo; taxa de entrega R$ 5,00; loja aberta.

## Design system
- `src/styles.css`: tokens oklch amarelo vibrante (#F7C600 aprox.) + preto, superfícies claras, botões pretos com acento amarelo; fonte de destaque marcante (ex. Archivo Black / Bebas) + corpo limpo.
- Layout responsivo inspirado nas referências: banner do topo com nome da loja, status aberto/fechado, navegação de categorias horizontal, grid de produtos com foto, carrinho lateral/flutuante.

## Banco de dados (migração Supabase)
Tabelas (somente o necessário):
- `store_settings` — linha única: store_name, delivery_fee, is_open.
- `categories` — name, display_order.
- `products` — category_id, name, description, price, image_url, available, display_order.
- `orders` — user_id, customer_name, phone, address, notes, payment_method (dinheiro/pix/cartao), delivery_fee, total, status (recebido → em_preparo → saiu_entrega → entregue), timestamps.
- `order_items` — order_id, product_name, unit_price, quantity (snapshot; sem FK obrigatória ao produto).
- `user_roles` — user_id, role ('super_admin' | 'admin'); função `has_role` security definer para as políticas.

RLS:
- Leitura pública (anon): categorias, produtos disponíveis, configurações da loja (nome/taxa/status).
- Cliente autenticado: ver e criar somente seus próprios pedidos.
- Admin (via has_role): gerenciar categorias, produtos, pedidos (status) e configurações da loja.

Storage:
- Bucket `product-images` (leitura pública, escrita só admin) para upload de imagens.

Seed na migração:
- Loja: CARTOON BURGUER, aberta, taxa R$ 5,00.
- Categorias de exemplo (ex.: Hambúrgueres, Acompanhamentos, Bebidas) e alguns produtos com imagens geradas.
- Super admin: usuário `cassiojunior290@gmail.com` criado no Auth + papel super_admin.

## Autenticação
- E-mail/senha (cliente e admin) via Supabase Auth; páginas de entrar/criar conta.
- Confirmar e-mail desativado? — mantido o padrão do seu Supabase; se precisar, ajusto depois.
- Papel do admin lido sempre pelo servidor (`has_role`), nunca no navegador.

## Estrutura do app (TanStack Start)
Público:
- `/` — cardápio: banner da loja, categorias, produtos, carrinho (adicionar/remover, quantidade), checkout em modal/página com nome, telefone, endereço, observações, forma de pagamento. Exige login para finalizar o pedido.
- `/meus-pedidos` — lista dos pedidos do usuário + status de cada um.
- `/auth` — entrar / criar conta.

Admin (protegido por login + papel):
- `/admin` — pedidos com botão de avançar status (Recebido → Em preparo → Saiu para entrega → Entregue).
- `/admin/produtos` — CRUD de produtos (preço, descrição, disponibilidade, imagem por upload ou URL).
- `/admin/categorias` — CRUD de categorias.
- `/admin/loja` — nome da loja, taxa de entrega, abrir/fechar loja.

Server functions (`createServerFn`): leitura pública com client publishable; dados do usuário com `requireSupabaseAuth`; ações de admin verificam `has_role` no servidor. Upload vai direto do navegador ao bucket (com política de admin).

## Ordem de execução
1. Migração (tabelas + RLS + bucket + seed) e criação do super admin.
2. Design system no `src/styles.css`.
3. Cardápio + carrinho + checkout + auth.
4. Meus pedidos + status.
5. Área admin completa.
6. Verificação no navegador (fluxo cliente e admin) e correções.

Nada além do descrito — sem extras.
