import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, ImagePlus, Languages, PackagePlus, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, withToken } from '../../lib/api';
import { clearAdminSession, getAdminSession } from '../../lib/adminSession';
import { useI18n } from '../../i18n/useI18n';
import { translateManagement } from '../../i18n/managementTranslations';
import menuTranslations from '../../i18n/menuTranslations';
import {
  getDefaultSubsection,
  getSectionChildren,
  MENU_SECTIONS,
  resolveProductFromLegacy,
  resolveProductImageUrl,
  SECTION_TRAITS,
} from '../../lib/menuCategories';
import '../../styles/Admin/AdminProducts.css';

const TRANSLATION_LANGUAGES = [
  { code: 'en', nativeName: 'English', dir: 'ltr' },
  { code: 'de', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'ar', nativeName: 'العربية', dir: 'rtl' },
  { code: 'ru', nativeName: 'Русский', dir: 'ltr' },
];

const emptyTranslations = () => Object.fromEntries(
  TRANSLATION_LANGUAGES.map(({ code }) => [code, { name: '', description: '' }]),
);

const EMPTY_PRODUCT = {
  name: '',
  menuSection: 'kahveler',
  menuSubsection: 'sicak-kahveler',
  description: '',
  intensity: 3,
  sellingPrice: '',
  costPrice: '',
  imageUrl: '',
  translations: emptyTranslations(),
  isAvailable: true,
};

const mapTranslationsToForm = (translations) => Object.fromEntries(
  TRANSLATION_LANGUAGES.map(({ code }) => [code, {
    name: translations?.[code]?.name || '',
    description: translations?.[code]?.description || '',
  }]),
);

const getMenuDictionary = (language) => menuTranslations[language] || menuTranslations.tr;

const Products = () => {
  const { language, locale, formatNumber } = useI18n();
  const session = getAdminSession();
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const mt = (key, values) => translateManagement(language, key, values) || key;
  const menuDictionary = useMemo(() => getMenuDictionary(language), [language]);
  const money = (value) => formatNumber(value || 0, { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 });
  const sortProducts = (items) => [...items].sort((a, b) => {
    const sectionCompare = (a.menuSection || '').localeCompare(b.menuSection || '', locale);
    if (sectionCompare !== 0) return sectionCompare;
    const subsectionCompare = (a.menuSubsection || '').localeCompare(b.menuSubsection || '', locale);
    if (subsectionCompare !== 0) return subsectionCompare;
    return a.name.localeCompare(b.name, locale);
  });

  const sectionLabel = (sectionId) => menuDictionary.guestMenu.categories.sections[sectionId]?.label || sectionId;
  const subsectionLabel = (subsectionId) => menuDictionary.guestMenu.categories.children[subsectionId]?.label || subsectionId;
  const traitKey = SECTION_TRAITS[form.menuSection] || 'coffee';
  const subsectionOptions = getSectionChildren(form.menuSection);

  const unauthorized = () => { clearAdminSession(); window.location.assign('/admin'); };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await api.get('/products/admin/all', withToken(session.token));
        setProducts(data);
      } catch (error) {
        if (error.response?.status === 401) unauthorized();
        else toast.error(error?.response?.data?.message || translateManagement(language, `api.${error?.response?.data?.messageKey}`, error?.response?.data?.messageParams) || translateManagement(language, 'adminProducts.errors.loadFailed') || 'Urunler getirilemedi.');
      } finally { setLoading(false); }
    };
    void loadProducts();
  }, [language, session?.token]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const updateMenuSection = (menuSection) => {
    const nextSubsection = getDefaultSubsection(menuSection);
    setForm((current) => ({
      ...current,
      menuSection,
      menuSubsection: nextSubsection,
    }));
  };

  const updateTranslationField = (translationLanguage, field, value) => setForm((current) => ({
    ...current,
    translations: {
      ...current.translations,
      [translationLanguage]: {
        ...current.translations?.[translationLanguage],
        [field]: value,
      },
    },
  }));

  const resetForm = () => {
    setForm({ ...EMPTY_PRODUCT, translations: emptyTranslations() });
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post('/products/upload-image', formData, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });
    return data.imageUrl;
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageFile(file);
      updateField('imageUrl', imageUrl);
      toast.success(mt('adminProducts.toast.imageUploaded'));
    } catch (error) {
      if (error.response?.status === 401) unauthorized();
      else toast.error(error?.response?.data?.message || mt('adminProducts.errors.imageUploadFailed'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      menuSection: form.menuSection,
      menuSubsection: subsectionOptions.length ? form.menuSubsection : null,
      intensity: Number(form.intensity),
      sellingPrice: Number(form.sellingPrice),
      costPrice: Number(form.costPrice),
      imageUrl: form.imageUrl.trim(),
      translations: Object.fromEntries(
        TRANSLATION_LANGUAGES.map(({ code }) => [code, {
          name: form.translations?.[code]?.name?.trim() || '',
          description: form.translations?.[code]?.description?.trim() || '',
        }]),
      ),
    };

    if (!payload.name || !payload.menuSection || Number.isNaN(payload.sellingPrice) || Number.isNaN(payload.costPrice)) {
      toast.warn(mt('adminProducts.toast.required'));
      return;
    }
    if (subsectionOptions.length && !payload.menuSubsection) {
      toast.warn(mt('adminProducts.toast.subsectionRequired'));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { data } = await api.put(`/products/${editingId}`, payload, withToken(session.token));
        setProducts((current) => sortProducts(current.map((product) => product._id === data._id ? data : product)));
        toast.success(mt('adminProducts.toast.updated'));
      } else {
        const { data } = await api.post('/products', payload, withToken(session.token));
        setProducts((current) => sortProducts([...current, data]));
        toast.success(mt('adminProducts.toast.created'));
      }
      resetForm();
    } catch (error) {
      if (error.response?.status === 401) unauthorized();
      else toast.error(error?.response?.data?.message || translateManagement(language, `api.${error?.response?.data?.messageKey}`, error?.response?.data?.messageParams) || mt('adminProducts.errors.saveFailed'));
    } finally { setSaving(false); }
  };

  const editProduct = (product) => {
    const classification = resolveProductFromLegacy(product);
    setEditingId(product._id);
    setForm({
      name: product.name || '',
      menuSection: classification.menuSection,
      menuSubsection: classification.menuSubsection || getDefaultSubsection(classification.menuSection),
      description: product.description || '',
      intensity: product.intensity ?? 3,
      sellingPrice: String(product.sellingPrice ?? ''),
      costPrice: String(product.costPrice ?? ''),
      imageUrl: product.imageUrl || '',
      translations: mapTranslationsToForm(product.translations),
      isAvailable: product.isAvailable !== false,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completedTranslationCount = TRANSLATION_LANGUAGES.filter(({ code }) => form.translations?.[code]?.name?.trim()).length;
  const previewImageUrl = resolveProductImageUrl(form.imageUrl);

  const deleteProduct = async (product) => {
    if (!window.confirm(mt('adminProducts.confirm.deleteProduct', { name: product.name }))) return;
    setDeletingId(product._id);
    try {
      await api.delete(`/products/${product._id}`, withToken(session.token));
      if (editingId === product._id) resetForm();
      setProducts((current) => current.filter((item) => item._id !== product._id));
      toast.success(mt('adminProducts.toast.deleted'));
    } catch (error) {
      toast.error(error?.response?.data?.message || translateManagement(language, `api.${error?.response?.data?.messageKey}`, error?.response?.data?.messageParams) || mt('adminProducts.errors.deleteFailed'));
    } finally { setDeletingId(null); }
  };

  const renderTraitOptions = () => [1, 2, 3, 4, 5].map((level) => (
    <option key={level} value={level}>{mt(`adminProducts.form.traitLevels.${traitKey}.${level}`)}</option>
  ));

  return <div className="admin-products-page">
    <header className="admin-page-heading">
      <div><p>{mt('adminProducts.pageEyebrow')}</p><h1>{mt('adminProducts.pageTitle')}</h1><span>{mt('adminProducts.pageDescription')}</span></div>
    </header>
    <div className="admin-products-layout">
      <section className="admin-product-form-card" aria-labelledby="product-form-title">
        <div className="admin-product-form-heading"><span>{editingId ? <Pencil size={19} /> : <PackagePlus size={19} />}</span><div><p>{editingId ? mt('adminProducts.form.editEyebrow') : mt('adminProducts.form.newEyebrow')}</p><h2 id="product-form-title">{editingId ? mt('adminProducts.form.editTitle') : mt('adminProducts.form.newTitle')}</h2></div></div>
        <form onSubmit={submit}>
          <label htmlFor="product-name">{mt('adminProducts.form.nameLabel')}<input id="product-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} maxLength="100" placeholder={mt('adminProducts.form.namePlaceholder')} required /></label>

          <label htmlFor="product-menu-section">{mt('adminProducts.form.menuSectionLabel')}
            <select id="product-menu-section" value={form.menuSection} onChange={(event) => updateMenuSection(event.target.value)} required>
              {MENU_SECTIONS.map((section) => <option key={section.id} value={section.id}>{sectionLabel(section.id)}</option>)}
            </select>
            <small>{mt('adminProducts.form.menuSectionHelp')}</small>
          </label>

          {subsectionOptions.length > 0 && <label htmlFor="product-menu-subsection">{mt('adminProducts.form.menuSubsectionLabel')}
            <select id="product-menu-subsection" value={form.menuSubsection} onChange={(event) => updateField('menuSubsection', event.target.value)} required>
              {subsectionOptions.map((child) => <option key={child.id} value={child.id}>{subsectionLabel(child.id)}</option>)}
            </select>
            <small>{mt('adminProducts.form.menuSubsectionHelp')}</small>
          </label>}

          <label htmlFor="product-description">{mt('adminProducts.form.descriptionLabel')}<textarea id="product-description" value={form.description} onChange={(event) => updateField('description', event.target.value)} maxLength="700" rows="3" placeholder={mt('adminProducts.form.descriptionPlaceholder')} /><small>{mt('adminProducts.form.descriptionHelp')}</small></label>

          <details key={`product-translations-${editingId || 'new'}`} className="admin-product-translations" defaultOpen={Boolean(editingId)}>
            <summary>
              <span className="admin-product-translations-icon"><Languages size={18} aria-hidden="true" /></span>
              <span className="admin-product-translations-copy">
                <strong>{mt('adminProducts.form.translationsTitle')}</strong>
                <small>{mt('adminProducts.form.translationsHelp')}</small>
              </span>
              <b>{mt('adminProducts.form.translationsProgress', { count: completedTranslationCount })}</b>
            </summary>
            <div className="admin-product-translations-body">
              {TRANSLATION_LANGUAGES.map(({ code, nativeName, dir }) => <section className="admin-product-translation" key={code}>
                <header>
                  <div><span>{code.toUpperCase()}</span><strong>{mt(`adminProducts.form.translationLanguages.${code}`)}</strong></div>
                  <small lang={code} dir={dir}>{nativeName}</small>
                </header>
                <div className="admin-product-translation-fields">
                  <label htmlFor={`product-${code}-name`}>
                    {mt('adminProducts.form.translationNameLabel')}
                    <input id={`product-${code}-name`} lang={code} dir={dir} value={form.translations?.[code]?.name || ''} onChange={(event) => updateTranslationField(code, 'name', event.target.value)} maxLength="100" placeholder={mt('adminProducts.form.translationNamePlaceholder')} />
                  </label>
                  <label htmlFor={`product-${code}-description`}>
                    {mt('adminProducts.form.translationDescriptionLabel')}
                    <textarea id={`product-${code}-description`} lang={code} dir={dir} value={form.translations?.[code]?.description || ''} onChange={(event) => updateTranslationField(code, 'description', event.target.value)} maxLength="700" rows="2" placeholder={mt('adminProducts.form.translationDescriptionPlaceholder')} />
                  </label>
                </div>
              </section>)}
            </div>
          </details>

          <label htmlFor="product-trait">{mt(`adminProducts.form.traitLabels.${traitKey}`)}
            <select id="product-trait" value={form.intensity} onChange={(event) => updateField('intensity', event.target.value)}>{renderTraitOptions()}</select>
            <small>{mt(`adminProducts.form.traitHelp.${traitKey}`)}</small>
          </label>

          <div className="admin-product-price-fields">
            <label htmlFor="product-selling-price">{mt('adminProducts.form.sellingPriceLabel')}<input id="product-selling-price" type="number" min="0" step="0.01" inputMode="decimal" value={form.sellingPrice} onChange={(event) => updateField('sellingPrice', event.target.value)} placeholder={mt('adminProducts.form.pricePlaceholder')} required /></label>
            <label htmlFor="product-cost-price">{mt('adminProducts.form.costPriceLabel')}<input id="product-cost-price" type="number" min="0" step="0.01" inputMode="decimal" value={form.costPrice} onChange={(event) => updateField('costPrice', event.target.value)} placeholder={mt('adminProducts.form.pricePlaceholder')} required /></label>
          </div>

          <div className="admin-product-image-field">
            <span>{mt('adminProducts.form.imageLabel')}</span>
            <div className="admin-product-image-upload">
              <div className="admin-product-image-preview">{previewImageUrl ? <img src={previewImageUrl} alt="" /> : <ImagePlus size={22} aria-hidden="true" />}</div>
              <div className="admin-product-image-actions">
                <input ref={fileInputRef} id="product-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageSelect} hidden />
                <button type="button" className="admin-product-image-button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  <Upload size={16} aria-hidden="true" />
                  {uploadingImage ? mt('adminProducts.form.imageUploading') : mt('adminProducts.form.imageUpload')}
                </button>
                {form.imageUrl && <button type="button" className="admin-product-image-remove" onClick={() => updateField('imageUrl', '')}>{mt('adminProducts.form.imageRemove')}</button>}
                <small>{mt('adminProducts.form.imageHelp')}</small>
              </div>
            </div>
          </div>

          <label className="admin-product-availability" htmlFor="product-available">
            <input id="product-available" type="checkbox" checked={form.isAvailable} onChange={(event) => updateField('isAvailable', event.target.checked)} />
            <span>{form.isAvailable ? <Eye size={17} /> : <EyeOff size={17} />}</span>
            <div><strong>{mt('adminProducts.form.availableTitle')}</strong><small>{mt('adminProducts.form.availableHelp')}</small></div>
          </label>

          <div className="admin-product-form-actions">
            {editingId && <button type="button" className="admin-product-cancel" onClick={resetForm}><X size={16} />{mt('adminProducts.form.cancel')}</button>}
            <button type="submit" disabled={saving || uploadingImage}>{saving ? mt('adminProducts.form.saving') : <>{editingId ? <Save size={16} /> : <Plus size={17} />}{editingId ? mt('adminProducts.form.save') : mt('adminProducts.form.create')}</>}</button>
          </div>
        </form>
      </section>

      <section className="admin-products-list-card" aria-labelledby="products-list-title">
        <header className="admin-products-list-heading"><div><ImagePlus size={20} /><div><h2 id="products-list-title">{mt('adminProducts.list.title')}</h2><span>{mt('adminProducts.list.description')}</span></div></div><b>{mt('adminProducts.list.count', { count: products.length })}</b></header>
        {loading ? <div className="admin-products-loading">{mt('adminProducts.list.loading')}</div> : products.length ? <div className="admin-products-list">{products.map((product) => {
          const classification = resolveProductFromLegacy(product);
          const listImage = resolveProductImageUrl(product.imageUrl);
          const categoryText = product.menuSubsection
            ? `${sectionLabel(classification.menuSection)} · ${subsectionLabel(classification.menuSubsection)}`
            : sectionLabel(classification.menuSection);
          return <article key={product._id} className={!product.isAvailable ? 'unavailable' : ''}>
            <div className="admin-product-image">{listImage ? <img src={listImage} alt="" /> : <ImagePlus size={20} />}</div>
            <div className="admin-product-copy"><div><span>{categoryText}</span>{!product.isAvailable && <b>{mt('adminProducts.list.unavailable')}</b>}</div><h3>{product.name}</h3><p><strong>{money(product.sellingPrice)}</strong><small>{mt('adminProducts.list.cost', { value: money(product.costPrice) })}</small></p></div>
            <div className="admin-product-actions"><button type="button" onClick={() => editProduct(product)}><Pencil size={16} />{mt('adminProducts.list.edit')}</button><button type="button" className="admin-product-delete" disabled={deletingId === product._id} onClick={() => deleteProduct(product)} aria-label={mt('adminProducts.aria.deleteProduct', { name: product.name })}><Trash2 size={16} /></button></div>
          </article>;
        })}</div> : <div className="admin-products-empty"><PackagePlus size={34} /><h3>{mt('adminProducts.list.emptyTitle')}</h3><p>{mt('adminProducts.list.emptyDescription')}</p></div>}
      </section>
    </div>
  </div>;
};

export default Products;
