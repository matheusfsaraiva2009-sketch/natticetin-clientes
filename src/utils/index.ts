/**
 * Formata um valor em centavos para moeda brasileira.
 * Ex: 2500 → "R$ 25,00"
 */
export function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

/**
 * Converte valor em reais (string) para centavos (inteiro).
 * Ex: "25,00" ou "25.00" → 2500
 */
export function parseCurrencyToCentavos(value: string): number {
  const clean = value.replace(/[^\d,\.]/g, '').replace(',', '.')
  const float = parseFloat(clean)
  if (isNaN(float)) return 0
  return Math.round(float * 100)
}

/**
 * Converte centavos para string decimal para exibição em input.
 * Ex: 2500 → "25.00"
 */
export function centavosToDecimalString(centavos: number): string {
  return (centavos / 100).toFixed(2)
}

/**
 * Formata número de telefone para WhatsApp.
 * Remove tudo que não for dígito.
 */
export function formatWhatsappNumber(number: string): string {
  return number.replace(/\D/g, '')
}

/**
 * Gera mensagem de pedido WhatsApp a partir dos itens do carrinho.
 */
export interface WhatsappOrderItem {
  name: string
  category: string
  color: string
  size: string
  price: number // centavos
  quantity: number
}

export function generateWhatsappMessage(items: WhatsappOrderItem[], orderId?: string): string {
  if (items.length === 0) return ''

  let total = 0
  const itemLines = items.map((item) => {
    const subtotal = item.price * item.quantity
    total += subtotal

    // Monta as partes da linha, omitindo tamanho quando vazio
    const parts: string[] = [item.name, item.color]
    if (item.size && item.size.trim() !== '') {
      parts.push(item.size.trim())
    }
    parts.push(`${item.quantity} un.`)
    parts.push(formatCurrency(subtotal))

    return `• ${parts.join(' | ')}`
  })

  const lines = [
    'Olá! Segue meu pedido da Nati Cetim:',
    '',
    itemLines.join('\n'),
    '',
    `Total: ${formatCurrency(total)}`,
  ]

  if (orderId) {
    lines.push('')
    lines.push(`Nº do pedido: ${orderId}`)
  }

  lines.push('')
  lines.push('Aguardo a confirmação.')

  return lines.join('\n')
}


/**
 * Abre o WhatsApp com a mensagem pré-preenchida.
 */
export function openWhatsapp(phoneNumber: string, message: string): void {
  const cleanNumber = formatWhatsappNumber(phoneNumber)
  const encodedMessage = encodeURIComponent(message)
  const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Trunca um texto no comprimento máximo especificado.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Valida se uma URL é válida.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Debounce simples para funções de busca.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
