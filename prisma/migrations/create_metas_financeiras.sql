-- ============================================================================
-- CEO DASHBOARD - TABELA DE METAS FINANCEIRAS
-- Migration para criação da tabela metas_financeiras no Supabase
-- ============================================================================

-- Criar tabela metas_financeiras
CREATE TABLE IF NOT EXISTS public.metas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Tipo e identificação
  tipo VARCHAR(50) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  
  -- Valores
  valor_meta DECIMAL(15,2) NOT NULL,
  unidade VARCHAR(20) NOT NULL DEFAULT 'currency',
  
  -- Período
  periodo VARCHAR(7) NOT NULL, -- YYYY-MM
  
  -- Dimensões (opcional - para filtros)
  centro_custo_id UUID,
  vendedor_id UUID,
  loja_id UUID,
  produto_id UUID,
  categoria VARCHAR(100),
  
  -- Visualização
  cor VARCHAR(20),
  icone VARCHAR(50),
  prioridade VARCHAR(20),
  visibilidade VARCHAR(20) DEFAULT 'privada',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT metas_financeiras_tipo_check 
    CHECK (tipo IN (
      'vendas', 
      'receita', 
      'receita_liquida', 
      'lucro', 
      'lucro_bruto', 
      'margem_lucro', 
      'margem_bruta', 
      'novos_clientes', 
      'clientes_recorrentes', 
      'ticket_medio', 
      'conversao', 
      'inadimplencia', 
      'despesas', 
      'cac', 
      'ltv', 
      'custom'
    )),
  CONSTRAINT metas_financeiras_unidade_check
    CHECK (unidade IN ('currency', 'percentage', 'number', 'days')),
  CONSTRAINT metas_financeiras_prioridade_check
    CHECK (prioridade IS NULL OR prioridade IN ('critica', 'alta', 'media', 'baixa')),
  CONSTRAINT metas_financeiras_visibilidade_check
    CHECK (visibilidade IN ('privada', 'equipe', 'empresa'))
);

-- Criar índices para performance
CREATE INDEX idx_metas_user_periodo ON public.metas_financeiras(user_id, periodo);
CREATE INDEX idx_metas_tipo ON public.metas_financeiras(tipo);
CREATE INDEX idx_metas_centro_custo ON public.metas_financeiras(centro_custo_id) WHERE centro_custo_id IS NOT NULL;
CREATE INDEX idx_metas_vendedor ON public.metas_financeiras(vendedor_id) WHERE vendedor_id IS NOT NULL;
CREATE INDEX idx_metas_loja ON public.metas_financeiras(loja_id) WHERE loja_id IS NOT NULL;
CREATE INDEX idx_metas_created_at ON public.metas_financeiras(created_at DESC);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_metas_financeiras_updated_at
    BEFORE UPDATE ON public.metas_financeiras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS na tabela
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas suas próprias metas
CREATE POLICY "Users can view own metas"
ON public.metas_financeiras
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir suas próprias metas
CREATE POLICY "Users can insert own metas"
ON public.metas_financeiras
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar suas próprias metas
CREATE POLICY "Users can update own metas"
ON public.metas_financeiras
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar suas próprias metas
CREATE POLICY "Users can delete own metas"
ON public.metas_financeiras
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- COMENTÁRIOS DA TABELA
-- ============================================================================

COMMENT ON TABLE public.metas_financeiras IS 'Metas financeiras do Dashboard CEO';
COMMENT ON COLUMN public.metas_financeiras.tipo IS 'Tipo da meta: vendas, receita, lucro, etc';
COMMENT ON COLUMN public.metas_financeiras.valor_meta IS 'Valor objetivo da meta';
COMMENT ON COLUMN public.metas_financeiras.unidade IS 'Unidade da meta: currency, percentage, number, days';
COMMENT ON COLUMN public.metas_financeiras.periodo IS 'Período da meta no formato YYYY-MM';
COMMENT ON COLUMN public.metas_financeiras.prioridade IS 'Prioridade da meta: critica, alta, media, baixa';
COMMENT ON COLUMN public.metas_financeiras.visibilidade IS 'Visibilidade da meta: privada, equipe, empresa';

-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- ============================================================================

-- Descomentar para inserir dados de exemplo
/*
INSERT INTO public.metas_financeiras (user_id, tipo, nome, valor_meta, unidade, periodo, prioridade)
VALUES
  (auth.uid(), 'receita', 'Meta de Receita Mensal', 50000.00, 'currency', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'alta'),
  (auth.uid(), 'novos_clientes', 'Meta de Novos Clientes', 20, 'number', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'alta'),
  (auth.uid(), 'ticket_medio', 'Meta de Ticket Médio', 2500.00, 'currency', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'media'),
  (auth.uid(), 'margem_lucro', 'Meta de Margem de Lucro', 15.0, 'percentage', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'media');
*/

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Verificar se a tabela foi criada
SELECT 
  'Tabela metas_financeiras criada com sucesso!' AS status,
  COUNT(*) AS total_colunas
FROM information_schema.columns 
WHERE table_name = 'metas_financeiras';



