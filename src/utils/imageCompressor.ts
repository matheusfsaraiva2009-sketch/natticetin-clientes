/**
 * Utilitário para redimensionar e comprimir imagens direto no navegador.
 * Permite salvar fotos leves e com alta qualidade diretamente no Firestore,
 * sem depender de serviços pagos ou de cartão de crédito no Storage.
 */

interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.8 } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'))

    reader.onload = () => {
      const img = new Image()

      img.onerror = () => reject(new Error('Falha ao carregar a imagem.'))

      img.onload = () => {
        let width = img.width
        let height = img.height

        // Redimensiona proporcionalmente mantendo a proporção original
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem no navegador.'))
          return
        }

        // Desenha a imagem no canvas com suavização
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Converte para JPEG otimizado
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }

      img.src = reader.result as string
    }

    reader.readAsDataURL(file)
  })
}
