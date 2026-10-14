import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import type { Product, ProductFormData, ProductCategory, ProductStatus } from '../../types'
import { createProduct, updateProduct } from '../../services/products'
import { uploadProductImage, validateImageFile, deleteImageByUrl } from '../../services/storage'
import { compressImageFile } from '../../utils/imageCompressor'
import { centavosToDecimalString, parseCurrencyToCentavos } from '../../utils'
import './ProductForm.css'

interface ProductFormProps {
  product: Product | null
  onSaved: () => void
  onCancel: () => void
}

const INITIAL_FORM: ProductFormData = {
  name: '',
  category: 'toucas',
  description: '',
  color: '',
  size: '',
  price: 0,
  stock: 0,
  imageUrl: '',
  imageUrls: [],
  active: true,
  status: 'active',
  featured: false,
}

export function ProductForm({ product, onSaved, onCancel }: ProductFormProps) {
  const isEditing = !!product

  const [form, setForm] = useState<ProductFormData>(() => {
    if (!product) return INITIAL_FORM
    return {
      name: product.name,
      category: product.category,
      description: product.description,
      color: product.color,
      size: product.size,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      imageUrls: product.imageUrls,
      active: product.status === 'inactive' ? false : (product.status === 'out_of_stock' ? true : product.active),
      status: product.status,
      featured: product.featured,
    }
  })

  const [priceInput, setPriceInput] = useState(
    product ? centavosToDecimalString(product.price) : ''
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!form.color.trim()) e.color = 'Cor é obrigatória'
    if (!form.size.trim()) e.size = 'Tamanho é obrigatório'
    if (form.price <= 0) e.price = 'Preço deve ser maior que zero'
    if (form.stock < 0) e.stock = 'Estoque não pode ser negativo'
    if (!Number.isInteger(form.stock)) e.stock = 'Estoque deve ser um número inteiro'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }

    setUploadError('')
    setUploadProgress(0)

    try {
      setUploadProgress(40)
      // Tenta comprimir e gerar dataURL otimizada (sem precisar de cartão nem do Storage)
      const dataUrl = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.82 })
      setField('imageUrl', dataUrl)
      setUploadProgress(null)
    } catch {
      // Fallback: se houver falha na compressão, tenta o upload tradicional
      try {
        const tempId = product?.id ?? `temp_${Date.now()}`
        const url = await uploadProductImage(tempId, file, (progress) => {
          setUploadProgress(progress)
        })
        setField('imageUrl', url)
        setUploadProgress(null)
      } catch (err: unknown) {
        const error = err as Error
        setUploadError(error.message || 'Erro ao carregar a imagem')
        setUploadProgress(null)
      }
    }

    // Limpa o input para permitir re-upload do mesmo arquivo
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleRemoveImage() {
    if (!form.imageUrl) return
    const confirmed = window.confirm('Remover a imagem deste produto?')
    if (!confirmed) return

    if (form.imageUrl.startsWith('http')) {
      try {
        await deleteImageByUrl(form.imageUrl)
      } catch {
        // Silencioso se a imagem já não existir
      }
    }
    setField('imageUrl', '')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSaving(true)
    try {
      const dataToSave: ProductFormData = {
        ...form,
        active: form.status !== 'inactive',
        stock: form.status === 'out_of_stock' ? 0 : form.stock,
      }
      if (isEditing && product) {
        await updateProduct(product.id, dataToSave)
      } else {
        await createProduct(dataToSave)
      }
      onSaved()
    } catch (err: unknown) {
      const error = err as Error
      alert(`Erro ao salvar produto: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="product-form animate-fade-in"
      noValidate
      aria-label={isEditing ? 'Editar produto' : 'Cadastrar novo produto'}
    >
      <div className="product-form__grid">
        {/* Coluna principal */}
        <div className="product-form__main">
          {/* Nome */}
          <div className="form-group">
            <label htmlFor="pf-name" className="form-label">
              Nome do produto <span className="required">*</span>
            </label>
            <input
              id="pf-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className={`form-input ${errors.name ? 'is-error' : ''}`}
              placeholder="Ex: Touca dupla face — Floral"
              maxLength={100}
              required
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          {/* Categoria */}
          <div className="form-group">
            <label htmlFor="pf-category" className="form-label">
              Categoria <span className="required">*</span>
            </label>
            <select
              id="pf-category"
              value={form.category}
              onChange={(e) => setField('category', e.target.value as ProductCategory)}
              className="form-select"
            >
              <option value="toucas">Touca Dupla Face</option>
              <option value="scrunchies">Scrunchie de Cetim</option>
            </select>
          </div>

          {/* Cor e Tamanho lado a lado */}
          <div className="product-form__row">
            <div className="form-group">
              <label htmlFor="pf-color" className="form-label">
                Cor <span className="required">*</span>
              </label>
              <input
                id="pf-color"
                type="text"
                value={form.color}
                onChange={(e) => setField('color', e.target.value)}
                className={`form-input ${errors.color ? 'is-error' : ''}`}
                placeholder="Ex: Bege e marrom"
                maxLength={60}
              />
              {errors.color && <span className="form-error">{errors.color}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="pf-size" className="form-label">
                Tamanho <span className="required">*</span>
              </label>
              <input
                id="pf-size"
                type="text"
                value={form.size}
                onChange={(e) => setField('size', e.target.value)}
                className={`form-input ${errors.size ? 'is-error' : ''}`}
                placeholder="Ex: Único, Padrão, P/M"
                maxLength={40}
              />
              {errors.size && <span className="form-error">{errors.size}</span>}
            </div>
          </div>

          {/* Preço e Estoque */}
          <div className="product-form__row">
            <div className="form-group">
              <label htmlFor="pf-price" className="form-label">
                Preço (R$) <span className="required">*</span>
              </label>
              <input
                id="pf-price"
                type="number"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value)
                  const centavos = parseCurrencyToCentavos(e.target.value)
                  setField('price', centavos)
                }}
                className={`form-input ${errors.price ? 'is-error' : ''}`}
                placeholder="25.00"
                min="0"
                step="0.01"
              />
              {errors.price && <span className="form-error">{errors.price}</span>}
              <span className="form-hint">Valor em reais. Ex: 25.00</span>
            </div>

            <div className="form-group">
              <label htmlFor="pf-stock" className="form-label">
                Estoque <span className="required">*</span>
              </label>
              <input
                id="pf-stock"
                type="number"
                value={form.stock}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0)
                  setField('stock', val)
                  if (val > 0 && form.status === 'out_of_stock') {
                    setField('status', 'active')
                    setField('active', true)
                  }
                }}
                className={`form-input ${errors.stock ? 'is-error' : ''}`}
                min="0"
                step="1"
                placeholder="0"
              />
              {errors.stock && <span className="form-error">{errors.stock}</span>}
              <span className="form-hint">Quantidade disponível</span>
            </div>
          </div>

          {/* Descrição */}
          <div className="form-group">
            <label htmlFor="pf-description" className="form-label">
              Descrição <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              id="pf-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="form-textarea"
              placeholder="Descrição do produto, materiais, cuidados..."
              maxLength={500}
              rows={3}
            />
            <span className="form-hint">{form.description.length}/500 caracteres</span>
          </div>
        </div>

        {/* Coluna lateral (imagem + status) */}
        <div className="product-form__sidebar">
          {/* Imagem */}
          <div className="product-form__image-section">
            <h3 className="product-form__section-title">Foto do produto</h3>

            {form.imageUrl ? (
              <div className="product-form__image-preview">
                <img
                  src={form.imageUrl}
                  alt="Prévia do produto"
                  className="product-form__preview-img"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="product-form__remove-img"
                  aria-label="Remover imagem"
                  id="btn-remove-product-image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="product-form__upload-area">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="product-form__upload-btn"
                  disabled={uploadProgress !== null}
                  id="btn-upload-image"
                  aria-label="Selecionar imagem do produto"
                >
                  {uploadProgress !== null ? (
                    <>
                      <div className="spinner" style={{ width: 24, height: 24 }} />
                      <span>{uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>Selecionar foto</span>
                      <span className="product-form__upload-hint">JPEG, PNG, WEBP — máx. 5 MB</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="sr-only"
              aria-label="Arquivo de imagem do produto"
              id="pf-image-input"
            />

            {uploadError && (
              <div className="alert alert-error" style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                {uploadError}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="product-form__status-section">
            <h3 className="product-form__section-title">Status</h3>

            <div className="form-group">
              <label htmlFor="pf-status" className="form-label">Disponibilidade</label>
              <select
                id="pf-status"
                value={form.status}
                onChange={(e) => {
                  const s = e.target.value as ProductStatus
                  setField('status', s)
                  // Inativo = oculto; Esgotado = visível mas sem estoque (active=true)
                  setField('active', s !== 'inactive')
                  if (s === 'out_of_stock') setField('stock', 0)
                }}
                className="form-select"
              >
                <option value="active">Ativo — disponível para venda</option>
                <option value="inactive">Inativo — oculto do catálogo</option>
                <option value="out_of_stock">Esgotado — visível, mas sem estoque</option>
              </select>
            </div>

            <div className="product-form__checkbox-row">
              <input
                id="pf-featured"
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setField('featured', e.target.checked)}
                className="product-form__checkbox"
              />
              <label htmlFor="pf-featured" className="product-form__checkbox-label">
                ⭐ Produto em destaque
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="product-form__actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost"
          disabled={isSaving}
          id="btn-product-form-cancel"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving || uploadProgress !== null}
          id="btn-product-form-save"
        >
          {isSaving ? (
            <>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} />
              Salvando...
            </>
          ) : isEditing ? (
            'Salvar alterações'
          ) : (
            'Cadastrar produto'
          )}
        </button>
      </div>
    </form>
  )
}
