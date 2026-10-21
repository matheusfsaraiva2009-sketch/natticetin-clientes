import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import type { Product, ProductFormData, ProductCategory, ProductStatus, SizeVariant } from '../../types'
import { createProduct, updateProduct } from '../../services/products'
import { uploadProductImage, validateImageFile, deleteImageByUrl } from '../../services/storage'
import { compressImageFile } from '../../utils/imageCompressor'
import { centavosToDecimalString, parseCurrencyToCentavos, formatCurrency } from '../../utils'
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
  variants: [],
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
      variants: product.variants ?? [],
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
  const [wholesalePriceInput, setWholesalePriceInput] = useState(
    product?.wholesalePrice ? centavosToDecimalString(product.wholesalePrice) : ''
  )

  // State para inputs temporários de nova variante
  const [newVariantSize, setNewVariantSize] = useState('')
  const [newVariantPriceInput, setNewVariantPriceInput] = useState('')
  const [newVariantStock, setNewVariantStock] = useState('')
  const [newVariantWholesalePriceInput, setNewVariantWholesalePriceInput] = useState('')
  const [newVariantWholesaleMinQty, setNewVariantWholesaleMinQty] = useState('')

  // State para inputs controlados das variantes existentes (preço e atacado como string)
  const [variantPriceInputs, setVariantPriceInputs] = useState<string[]>(
    () => (product?.variants ?? []).map((v) => centavosToDecimalString(v.price))
  )
  const [variantWholesalePriceInputs, setVariantWholesalePriceInputs] = useState<string[]>(
    () => (product?.variants ?? []).map((v) => v.wholesalePrice ? centavosToDecimalString(v.wholesalePrice) : '')
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasVariants = form.variants.length > 0

  function setField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key as string]) {
      setErrors((prev) => { const e = { ...prev }; delete e[key as string]; return e })
    }
  }

  // ── Variantes ──
  function addVariant() {
    const size = newVariantSize.trim()
    const price = parseCurrencyToCentavos(newVariantPriceInput)
    const stock = Math.max(0, parseInt(newVariantStock) || 0)
    const wholesalePrice = newVariantWholesalePriceInput
      ? parseCurrencyToCentavos(newVariantWholesalePriceInput)
      : undefined
    const wholesaleMinQty = newVariantWholesaleMinQty
      ? Math.max(1, parseInt(newVariantWholesaleMinQty) || 1)
      : undefined

    if (!size) return
    if (price <= 0) return
    if (form.variants.some(v => v.size.toLowerCase() === size.toLowerCase())) return

    const newVariant: SizeVariant = {
      size, price, stock,
      ...(wholesalePrice != null && wholesalePrice > 0 && { wholesalePrice }),
      ...(wholesaleMinQty != null && { wholesaleMinQty }),
    }
    setField('variants', [...form.variants, newVariant])
    // Sincroniza os arrays de inputs com a nova variante adicionada
    setVariantPriceInputs((prev) => [...prev, centavosToDecimalString(price)])
    setVariantWholesalePriceInputs((prev) => [
      ...prev,
      wholesalePrice != null && wholesalePrice > 0 ? centavosToDecimalString(wholesalePrice) : '',
    ])
    setNewVariantSize('')
    setNewVariantPriceInput('')
    setNewVariantStock('')
    setNewVariantWholesalePriceInput('')
    setNewVariantWholesaleMinQty('')
  }

  function updateVariantStock(index: number, stock: number) {
    const updated = form.variants.map((v, i) => i === index ? { ...v, stock } : v)
    setField('variants', updated)
  }

  function updateVariantPrice(index: number, priceStr: string) {
    const price = parseCurrencyToCentavos(priceStr)
    const updated = form.variants.map((v, i) => i === index ? { ...v, price } : v)
    setField('variants', updated)
  }

  function updateVariantWholesalePrice(index: number, priceStr: string) {
    const wholesalePrice = priceStr ? parseCurrencyToCentavos(priceStr) : undefined
    const updated = form.variants.map((v, i) =>
      i === index ? { ...v, ...(wholesalePrice != null && wholesalePrice > 0 ? { wholesalePrice } : { wholesalePrice: undefined }) } : v
    )
    setField('variants', updated)
  }

  function updateVariantWholesaleMinQty(index: number, qtyStr: string) {
    const wholesaleMinQty = qtyStr ? Math.max(1, parseInt(qtyStr) || 1) : undefined
    const updated = form.variants.map((v, i) =>
      i === index ? { ...v, wholesaleMinQty } : v
    )
    setField('variants', updated)
  }

  function removeVariant(index: number) {
    setField('variants', form.variants.filter((_, i) => i !== index))
    setVariantPriceInputs((prev) => prev.filter((_, i) => i !== index))
    setVariantWholesalePriceInputs((prev) => prev.filter((_, i) => i !== index))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!form.color.trim()) e.color = 'Cor é obrigatória'

    if (hasVariants) {
      // Com variantes, não precisa de price/stock/size únicos
    } else {
      if (!form.size.trim()) e.size = 'Tamanho é obrigatório'
      if (form.price <= 0) e.price = 'Preço deve ser maior que zero'
      if (form.stock < 0) e.stock = 'Estoque não pode ser negativo'
      if (!Number.isInteger(form.stock)) e.stock = 'Estoque deve ser um número inteiro'
    }

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
      const dataUrl = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.82 })
      setField('imageUrl', dataUrl)
      setUploadProgress(null)
    } catch {
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
      // Calcula estoque total a partir das variantes (se existirem)
      const totalStock = hasVariants
        ? form.variants.reduce((sum, v) => sum + v.stock, 0)
        : (form.status === 'out_of_stock' ? 0 : form.stock)

      // Preço principal = menor preço das variantes (para exibição/fallback)
      const mainPrice = hasVariants
        ? Math.min(...form.variants.map(v => v.price))
        : form.price

      const dataToSave: ProductFormData = {
        ...form,
        price: mainPrice,
        stock: form.status === 'out_of_stock' ? 0 : totalStock,
        active: form.status !== 'inactive',
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

          {/* Cor */}
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

          {/* ── VARIANTES DE TAMANHO ── */}
          <div className="product-form__variants-section">
            <div className="product-form__variants-header">
              <h3 className="product-form__section-title">Tamanhos e preços</h3>
              <p className="form-hint">
                {hasVariants
                  ? 'Cada tamanho tem seu próprio preço e estoque.'
                  : 'Adicione variantes de tamanho (M, G…) ou defina um único tamanho abaixo.'}
              </p>
            </div>

            {/* Tabela de variantes existentes */}
            {hasVariants && (
              <div className="variants-table">
                <div className="variants-table__header">
                  <span>Tamanho</span>
                  <span>Preço (R$)</span>
                  <span>Atacado (R$)</span>
                  <span>Mín. atacado</span>
                  <span>Estoque</span>
                  <span></span>
                </div>
                {form.variants.map((v, i) => (
                  <div key={v.size} className="variants-table__row">
                    <span className="variants-table__size">{v.size}</span>
                    <input
                      type="number"
                      value={variantPriceInputs[i] ?? centavosToDecimalString(v.price)}
                      onChange={(e) => {
                        const val = e.target.value
                        setVariantPriceInputs((prev) => { const arr = [...prev]; arr[i] = val; return arr })
                        updateVariantPrice(i, val)
                      }}
                      className="form-input variants-table__input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      id={`pf-variant-price-${i}`}
                    />
                    <input
                      type="number"
                      value={variantWholesalePriceInputs[i] ?? (v.wholesalePrice ? centavosToDecimalString(v.wholesalePrice) : '')}
                      onChange={(e) => {
                        const val = e.target.value
                        setVariantWholesalePriceInputs((prev) => { const arr = [...prev]; arr[i] = val; return arr })
                        updateVariantWholesalePrice(i, val)
                      }}
                      className="form-input variants-table__input"
                      min="0"
                      step="0.01"
                      placeholder="opcional"
                      id={`pf-variant-wholesale-price-${i}`}
                    />
                    <input
                      type="number"
                      defaultValue={v.wholesaleMinQty ?? ''}
                      onBlur={(e) => updateVariantWholesaleMinQty(i, e.target.value)}
                      className="form-input variants-table__input"
                      min="1"
                      step="1"
                      placeholder="qtd"
                      id={`pf-variant-wholesale-qty-${i}`}
                    />
                    <input
                      type="number"
                      value={v.stock}
                      onChange={(e) => updateVariantStock(i, Math.max(0, parseInt(e.target.value) || 0))}
                      className="form-input variants-table__input"
                      min="0"
                      step="1"
                      id={`pf-variant-stock-${i}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="variants-table__remove"
                      aria-label={`Remover tamanho ${v.size}`}
                      id={`btn-remove-variant-${i}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
                <div className="variants-table__total">
                  <span>Total em estoque:</span>
                  <strong>{form.variants.reduce((s, v) => s + v.stock, 0)} un.</strong>
                </div>
              </div>
            )}

            {/* Adicionar nova variante */}
            <div className="variants-add">
              <p className="variants-add__label">+ Adicionar tamanho</p>
              <div className="variants-add__row">
                <input
                  type="text"
                  value={newVariantSize}
                  onChange={(e) => setNewVariantSize(e.target.value)}
                  className="form-input"
                  placeholder="Tam. (ex: M)"
                  maxLength={10}
                  id="pf-new-variant-size"
                />
                <input
                  type="number"
                  value={newVariantPriceInput}
                  onChange={(e) => setNewVariantPriceInput(e.target.value)}
                  className="form-input"
                  placeholder="Preço (R$)"
                  min="0"
                  step="0.01"
                  id="pf-new-variant-price"
                />
                <input
                  type="number"
                  value={newVariantWholesalePriceInput}
                  onChange={(e) => setNewVariantWholesalePriceInput(e.target.value)}
                  className="form-input"
                  placeholder="Atacado (R$)"
                  min="0"
                  step="0.01"
                  id="pf-new-variant-wholesale-price"
                />
                <input
                  type="number"
                  value={newVariantWholesaleMinQty}
                  onChange={(e) => setNewVariantWholesaleMinQty(e.target.value)}
                  className="form-input"
                  placeholder="Mín. un."
                  min="1"
                  step="1"
                  id="pf-new-variant-wholesale-qty"
                />
                <input
                  type="number"
                  value={newVariantStock}
                  onChange={(e) => setNewVariantStock(e.target.value)}
                  className="form-input"
                  placeholder="Estoque"
                  min="0"
                  step="1"
                  id="pf-new-variant-stock"
                />
                <button
                  type="button"
                  onClick={addVariant}
                  className="btn btn-secondary btn-sm variants-add__btn"
                  disabled={!newVariantSize.trim() || !newVariantPriceInput}
                  id="btn-add-variant"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Preço e Estoque únicos (só mostra se não há variantes) */}
          {!hasVariants && (
            <>
              <div className="product-form__row">
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
                    placeholder="Ex: Único, Padrão"
                    maxLength={40}
                  />
                  {errors.size && <span className="form-error">{errors.size}</span>}
                </div>
              </div>

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

              {/* Atacado */}
              <div className="product-form__wholesale-section">
                <h4 className="product-form__wholesale-title">Preço de atacado <span className="form-hint" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></h4>
                <div className="product-form__row">
                  <div className="form-group">
                    <label htmlFor="pf-wholesale-price" className="form-label">Preço de atacado (R$)</label>
                    <input
                      id="pf-wholesale-price"
                      type="number"
                      value={wholesalePriceInput}
                      onChange={(e) => {
                        setWholesalePriceInput(e.target.value)
                        const centavos = parseCurrencyToCentavos(e.target.value)
                        setField('wholesalePrice', centavos > 0 ? centavos : undefined)
                      }}
                      className="form-input"
                      placeholder="Ex: 10.00"
                      min="0"
                      step="0.01"
                    />
                    <span className="form-hint">Preço por unidade no atacado</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pf-wholesale-min-qty" className="form-label">Quantidade mínima</label>
                    <input
                      id="pf-wholesale-min-qty"
                      type="number"
                      value={form.wholesaleMinQty ?? ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        setField('wholesaleMinQty', val >= 1 ? val : undefined)
                      }}
                      className="form-input"
                      placeholder="Ex: 5"
                      min="1"
                      step="1"
                    />
                    <span className="form-hint">A partir de quantas peças o desconto é aplicado</span>
                  </div>
                </div>
              </div>
            </>
          )}

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

          {/* Resumo de variantes no sidebar */}
          {hasVariants && (
            <div className="product-form__variants-summary">
              <h4 className="product-form__section-title">Resumo de tamanhos</h4>
              {form.variants.map((v, i) => (
                <div key={i} className="variants-summary__row">
                  <span className="variants-summary__size">{v.size}</span>
                  <span className="variants-summary__price">{formatCurrency(v.price)}</span>
                  {v.wholesalePrice != null && v.wholesaleMinQty != null && (
                    <span className="variants-summary__wholesale">
                      Atacado: {formatCurrency(v.wholesalePrice)} / {v.wholesaleMinQty}+ un.
                    </span>
                  )}
                  <span className="variants-summary__stock">{v.stock} un.</span>
                </div>
              ))}
            </div>
          )}
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
