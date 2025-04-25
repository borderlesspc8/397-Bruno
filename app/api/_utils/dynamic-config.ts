/**
 * Configurações para forçar todas as rotas da API a usarem renderização dinâmica
 * Importar este arquivo em todas as rotas da API que precisam de renderização dinâmica
 * 
 * Isso resolve o erro: "Dynamic server usage: Route /api/* couldn't be rendered statically because it used `headers`"
 */

// Forçar todas as rotas a serem dinâmicas (sem pré-renderização estática)
export const dynamic = 'force-dynamic';

// Desabilitar cache de fetch para sempre buscar dados frescos
export const fetchCache = 'force-no-store';

// Desabilitar revalidação automática
export const revalidate = 0;

// Exportar as configurações como padrão para facilitar importação
export default {
  dynamic: 'force-dynamic',
  fetchCache: 'force-no-store',
  revalidate: 0
}; 