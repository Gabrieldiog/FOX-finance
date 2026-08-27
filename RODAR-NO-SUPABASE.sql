-- ═══════════════════════════════════════════════════════════════════════
--  Fox Finance — o que falta no banco de produção
--
--  Cole isto inteiro no SQL Editor do Supabase e clique em RUN.
--  É seguro rodar mais de uma vez: nada é apagado, nada é duplicado.
--
--  O que faz:
--    1. cria a tabela cost_setting  → destrava a calculadora "vale a pena?",
--       que hoje fica presa em "Somando sua grana…"
--    2. cria as categorias Corridas, Combustível e Carro
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. A tabela de custos de quem roda de aplicativo ───────────────────
-- Uma linha por usuário; o user_id é a própria chave, então duplicata é
-- impossível. Quem nunca abriu os ajustes não tem linha e o app usa os
-- defaults declarados aqui.
CREATE TABLE IF NOT EXISTS public.cost_setting (
    user_id                     text     NOT NULL,
    fuel_price_cents            integer  DEFAULT 600    NOT NULL,
    km_per_liter_centi          integer  DEFAULT 3000   NOT NULL,  -- 30 km/l
    maintenance_cents_per_km    integer  DEFAULT 15     NOT NULL,
    vehicle_value_cents         bigint   DEFAULT 0      NOT NULL,
    vehicle_lifetime_km         integer  DEFAULT 100000 NOT NULL,
    depreciation_factor_centi   integer  DEFAULT 60     NOT NULL,  -- 0,60
    fixed_cost_cents_per_month  bigint   DEFAULT 0      NOT NULL,
    worked_days_per_month       integer  DEFAULT 22     NOT NULL,
    target_cents_per_hour       integer  DEFAULT 2500   NOT NULL,  -- R$ 25/h
    include_return_trip         boolean  DEFAULT true   NOT NULL,
    created_at                  timestamp with time zone DEFAULT now() NOT NULL,
    updated_at                  timestamp with time zone DEFAULT now() NOT NULL,

    CONSTRAINT cost_setting_pkey PRIMARY KEY (user_id),
    CONSTRAINT cost_preco_nao_negativo       CHECK (fuel_price_cents >= 0),
    CONSTRAINT cost_consumo_nao_negativo     CHECK (km_per_liter_centi >= 0),
    CONSTRAINT cost_manutencao_nao_negativa  CHECK (maintenance_cents_per_km >= 0),
    CONSTRAINT cost_dias_validos             CHECK (worked_days_per_month BETWEEN 0 AND 31),
    CONSTRAINT cost_fator_valido             CHECK (depreciation_factor_centi BETWEEN 0 AND 100),
    CONSTRAINT cost_vida_util_nao_negativa   CHECK (vehicle_lifetime_km >= 0)
);

-- A chave estrangeira vai separada, para o script não quebrar se rodar de novo.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cost_setting_user_id_user_id_fk'
    ) THEN
        ALTER TABLE public.cost_setting
            ADD CONSTRAINT cost_setting_user_id_user_id_fk
            FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ── 2. As categorias de quem roda de carro pra ganhar dinheiro ─────────
-- user_id nulo = categoria global, que todo mundo enxerga.
-- O WHERE NOT EXISTS impede duplicar se este script rodar de novo.
INSERT INTO public.category (name, type, icon, color)
SELECT v.name, v.type, v.icon, v.color
FROM (VALUES
    ('Corridas',    'income',  'car',   '#10b981'),
    ('Combustível', 'expense', 'fuel',  '#f97316'),
    ('Carro',       'expense', 'tools', '#64748b')
) AS v(name, type, icon, color)
WHERE NOT EXISTS (
    SELECT 1 FROM public.category c
    WHERE c.user_id IS NULL AND c.name = v.name
);


-- ── Conferência: rode e veja o resultado ──────────────────────────────
SELECT
    (SELECT count(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'cost_setting')      AS tabela_criada,
    (SELECT count(*) FROM public.category WHERE user_id IS NULL)          AS categorias_globais,
    (SELECT count(*) FROM public.category
      WHERE user_id IS NULL AND name IN ('Corridas','Combustível','Carro')) AS categorias_novas;

-- Esperado:  tabela_criada = 1  ·  categorias_globais = 16  ·  categorias_novas = 3
