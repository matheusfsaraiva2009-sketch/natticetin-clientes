import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react'
import type { StoreSettings } from '../../types'
import { getStoreSettings, saveStoreSettings } from '../../services/settings'
import { uploadBrandLogo, uploadHeroImage, validateImageFile, deleteImageByUrl } from '../../services/storage'
import { compressImageFile } from '../../utils/imageCompressor'

interface SettingsFormProps {
  onSaved: () => void
}

export function SettingsForm({ onSaved }: SettingsFormProps) {
  const [form, setForm] = useState<StoreSettings>({
    brandName: '',
    logoUrl: '',
    tagline: '',
    description: '',
    whatsappNumber: '',
    instagramHandle: '',
    instagramUrl: '',
    footerText: '',
    heroImageUrl: '',
    heroTitle: '',
    heroSubtitle: '',
    primaryEmail: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoProgress, setLogoProgress] = useState<number | null>(null)
  const [heroProgress, setHeroProgress] = useState<number | null>(null)
  const [logoUploadError, setLogoUploadError] = useState('')
  const [heroUploadError, setHeroUploadError] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getStoreSettings().then((settings) => {
      setForm(settings)
      setIsLoading(false)
    })
  }, [])

  function setField(key: keyof StoreSettings, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { setLogoUploadError(err); return }
    setLogoUploadError('')
    setLogoProgress(40)
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 })
      setField('logoUrl', dataUrl)
    } catch {
      try {
        // Exclui a logo antiga do Storage (pode ter extensao diferente) antes de enviar a nova
        if (form.logoUrl && form.logoUrl.startsWith('http')) {
          await deleteImageByUrl(form.logoUrl).catch(() => { /* ignora se não existir */ })
        }
        const url = await uploadBrandLogo(file, (p) => setLogoProgress(p))
        setField('logoUrl', url)
      } catch (error: unknown) {
        setLogoUploadError((error as Error).message)
      }
    } finally {
      setLogoProgress(null)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handleHeroUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { setHeroUploadError(err); return }
    setHeroUploadError('')
    setHeroProgress(40)
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 1200, maxHeight: 800, quality: 0.82 })
      setField('heroImageUrl', dataUrl)
    } catch {
      try {
        // Exclui a imagem hero antiga do Storage antes de enviar a nova
        if (form.heroImageUrl && form.heroImageUrl.startsWith('http')) {
          await deleteImageByUrl(form.heroImageUrl).catch(() => { /* ignora se não existir */ })
        }
        const url = await uploadHeroImage(file, (p) => setHeroProgress(p))
        setField('heroImageUrl', url)
      } catch (error: unknown) {
        setHeroUploadError((error as Error).message)
      }
    } finally {
      setHeroProgress(null)
      if (heroInputRef.current) heroInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      await saveStoreSettings(form)
      onSaved()
    } catch (error: unknown) {
      alert(`Erro ao salvar: ${(error as Error).message}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
  }

  return (
    <form onSubmit={handleSubmit} className="settings-form animate-fade-in" noValidate>
      {logoUploadError && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
          Logo: {logoUploadError}
        </div>
      )}
      {heroUploadError && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
          Hero: {heroUploadError}
        </div>
      )}

      {/* Identidade */}
      <section className="settings-section">
        <h2 className="settings-section__title">Identidade da marca</h2>
        <div className="settings-section__grid">
          <div className="form-group">
            <label htmlFor="sf-brand-name" className="form-label">Nome da marca</label>
            <input id="sf-brand-name" type="text" value={form.brandName} onChange={(e) => setField('brandName', e.target.value)} className="form-input" placeholder="Val Acessórios" />
          </div>
          <div className="form-group">
            <label htmlFor="sf-tagline" className="form-label">Tagline</label>
            <input id="sf-tagline" type="text" value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} className="form-input" placeholder="Elegância e delicadeza em cada detalhe" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="sf-description" className="form-label">Descrição breve</label>
            <textarea id="sf-description" value={form.description} onChange={(e) => setField('description', e.target.value)} className="form-textarea" placeholder="Descrição da loja para o rodapé e SEO" rows={2} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="sf-footer-text" className="form-label">Texto do rodapé</label>
            <input id="sf-footer-text" type="text" value={form.footerText} onChange={(e) => setField('footerText', e.target.value)} className="form-input" placeholder="© 2025 Val Acessórios. Todos os direitos reservados." />
          </div>
        </div>

        {/* Logo */}
        <div className="settings-upload-row">
          <div>
            <label className="form-label">Logo da marca</label>
            <p className="form-hint">PNG ou SVG com fundo transparente. Máx. 5 MB.</p>
          </div>
          <div className="settings-upload-preview">
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo atual" className="settings-upload-preview__img" />
            )}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="btn btn-ghost btn-sm"
              disabled={logoProgress !== null}
              id="btn-upload-logo"
            >
              {logoProgress !== null ? `Enviando... ${logoProgress}%` : form.logoUrl ? 'Trocar logo' : 'Enviar logo'}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" id="sf-logo-input" />
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="settings-section">
        <h2 className="settings-section__title">Seção principal (Hero)</h2>
        <div className="settings-section__grid">
          <div className="form-group">
            <label htmlFor="sf-hero-title" className="form-label">Título principal</label>
            <input id="sf-hero-title" type="text" value={form.heroTitle} onChange={(e) => setField('heroTitle', e.target.value)} className="form-input" placeholder="Cuide do seu cabelo com elegância" />
          </div>
          <div className="form-group">
            <label htmlFor="sf-hero-subtitle" className="form-label">Subtítulo</label>
            <input id="sf-hero-subtitle" type="text" value={form.heroSubtitle} onChange={(e) => setField('heroSubtitle', e.target.value)} className="form-input" placeholder="Toucas dupla face e scrunchies de cetim..." />
          </div>
        </div>
        <div className="settings-upload-row">
          <div>
            <label className="form-label">Imagem de fundo do hero</label>
            <p className="form-hint">Foto da loja ou produto. Recomendado: 1920×1080. Máx. 5 MB.</p>
          </div>
          <div className="settings-upload-preview">
            {form.heroImageUrl && (
              <img src={form.heroImageUrl} alt="Hero atual" className="settings-upload-preview__img" />
            )}
            <button
              type="button"
              onClick={() => heroInputRef.current?.click()}
              className="btn btn-ghost btn-sm"
              disabled={heroProgress !== null}
              id="btn-upload-hero"
            >
              {heroProgress !== null ? `Enviando... ${heroProgress}%` : form.heroImageUrl ? 'Trocar imagem' : 'Enviar imagem'}
            </button>
            <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroUpload} className="sr-only" id="sf-hero-input" />
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="settings-section">
        <h2 className="settings-section__title">Contato e redes sociais</h2>
        <div className="settings-section__grid">
          <div className="form-group">
            <label htmlFor="sf-whatsapp" className="form-label">Número do WhatsApp</label>
            <input
              id="sf-whatsapp"
              type="tel"
              value={form.whatsappNumber}
              onChange={(e) => setField('whatsappNumber', e.target.value.replace(/\D/g, ''))}
              className="form-input"
              placeholder="5511999999999"
            />
            <span className="form-hint">Formato internacional sem espaços: 55 + DDD + número. Ex: 5511999999999</span>
          </div>
          <div className="form-group">
            <label htmlFor="sf-email" className="form-label">E-mail de contato</label>
            <input id="sf-email" type="email" value={form.primaryEmail} onChange={(e) => setField('primaryEmail', e.target.value)} className="form-input" placeholder="contato@valacessorios.com.br" />
          </div>
          <div className="form-group">
            <label htmlFor="sf-instagram-handle" className="form-label">Instagram (arroba)</label>
            <input id="sf-instagram-handle" type="text" value={form.instagramHandle} onChange={(e) => setField('instagramHandle', e.target.value)} className="form-input" placeholder="@valacessorios" />
          </div>
          <div className="form-group">
            <label htmlFor="sf-instagram-url" className="form-label">URL completa do Instagram</label>
            <input id="sf-instagram-url" type="url" value={form.instagramUrl} onChange={(e) => setField('instagramUrl', e.target.value)} className="form-input" placeholder="https://instagram.com/valacessorios" />
          </div>
        </div>
      </section>

      <div className="product-form__actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={isSaving} id="btn-settings-save">
          {isSaving ? (
            <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} /> Salvando...</>
          ) : (
            'Salvar configurações'
          )}
        </button>
      </div>
    </form>
  )
}
