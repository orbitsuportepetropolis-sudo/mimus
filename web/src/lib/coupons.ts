/**
 * Utilitários de Cupons para o Mimus SaaS
 * Trata fusos horários e datas de validade garantindo que o cupom
 * seja válido até o final do dia selecionado (23:59:59).
 */

/**
 * Converte a string de data (YYYY-MM-DD) do input para uma data com expiração às 23:59:59 no fuso local
 */
export function formatExpiryToISO(dateString: string | null | undefined): string | null {
  if (!dateString) return null
  const cleaned = dateString.trim()
  if (!cleaned) return null

  // Se já for ISO completa
  if (cleaned.includes('T')) {
    return cleaned
  }

  // Se for YYYY-MM-DD
  const parts = cleaned.split('-').map(Number)
  if (parts.length !== 3) return null
  const [year, month, day] = parts
  if (!year || !month || !day) return null

  // Define a expiração para o final do dia no horário local (23:59:59.999)
  const localEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
  return localEndOfDay.toISOString()
}

/**
 * Converte a data do banco para o formato YYYY-MM-DD aceito pelo <input type="date">
 * respeitando o fuso local e compatibilidade com cupons antigos.
 */
export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return ''

  // Para cupons legados que foram salvos como UTC meia-noite (ex: 2026-09-26T00:00:00.000Z)
  if (dateString.includes('T00:00:00')) {
    return dateString.split('T')[0]
  }

  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formata a data para exibição amigável ao usuário (ex: "26/09/2026")
 */
export function formatCouponDisplayDate(dateString: string | null | undefined): string {
  if (!dateString) return ''

  // Para cupons legados que foram salvos como UTC meia-noite
  if (dateString.includes('T00:00:00')) {
    const parts = dateString.split('T')[0].split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day}/${month}/${year}`
    }
  }

  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR')
}

/**
 * Avalia se o cupom está expirado com tolerância e garantia de validade até o fim do dia
 */
export function isCouponExpired(dateString: string | null | undefined): boolean {
  if (!dateString) return false

  // Para cupons legados gravados como T00:00:00 (onde 26/09 virou 00:00Z)
  if (dateString.includes('T00:00:00')) {
    const parts = dateString.split('T')[0].split('-').map(Number)
    if (parts.length === 3) {
      const [year, month, day] = parts
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
      return endOfDay.getTime() < Date.now()
    }
  }

  const expiry = new Date(dateString)
  if (isNaN(expiry.getTime())) return false

  return expiry.getTime() < Date.now()
}
