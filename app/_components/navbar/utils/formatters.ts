/**
 * Formata um valor numérico para moeda brasileira (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata uma data para exibição relativa (ex: "2 minutos atrás")
 */
export function formatarTempoRelativo(data: Date): string {
  const agora = new Date();
  const diff = agora.getTime() - data.getTime();
  
  const segundos = Math.floor(diff / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  
  if (segundos < 60) {
    return "agora mesmo";
  } else if (minutos < 60) {
    return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} atrás`;
  } else if (horas < 24) {
    return `${horas} ${horas === 1 ? 'hora' : 'horas'} atrás`;
  } else if (dias < 7) {
    return `${dias} ${dias === 1 ? 'dia' : 'dias'} atrás`;
  } else {
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
} 