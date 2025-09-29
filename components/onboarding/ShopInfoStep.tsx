import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { ImageIcon } from '../Icons';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { processImageFile } from '../../lib/heicUtils';

interface ShopInfoData {
  name: string;
  phone: string;
  email: string;
  isLocal: boolean;
  isMobile: boolean;
  addressLine1: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;
  shopImageUrl?: string;
  serviceZones: Array<{
    city: string;
    radius: number;
    unit: 'km' | 'miles';
  }>;
}

interface ShopInfoStepProps {
  onBack: () => void;
  onNext: () => void;
}

const ShopInfoStep: React.FC<ShopInfoStepProps> = ({ onBack, onNext }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Persistance du formulaire
  const {
    data: formData,
    setData: setFormData,
    updateData: updateField,
    clearData: clearFormData
  } = useFormPersistence<ShopInfoData>({
    key: 'onboarding_shop_info',
    defaultData: {
      name: '',
      phone: '',
      email: user?.email || '',
      isLocal: true,
      isMobile: false,
      addressLine1: '',
      addressCity: '',
      addressPostalCode: '',
      addressCountry: 'France',
      shopImageUrl: '',
      serviceZones: []
    }
  });

  useEffect(() => {
    loadExistingData();
  }, [user]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    try {
      // Traiter le fichier image (validation + conversion HEIC)
      const processedFile = await processImageFile(file);

      // Vérifier que le fichier n'est pas vide
      if (processedFile.size === 0) {
        throw new Error('Le fichier image est vide ou corrompu');
      }

      // Upload vers Supabase Storage
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `shop_${Date.now()}.${fileExt}`;
      const filePath = `shop-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, processedFile);

      if (uploadError) {
        throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      updateField('shopImageUrl', publicUrl);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const loadExistingData = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('email', user.email)
        .single();

      if (shop) {
        setFormData({
          name: shop.name || '',
          phone: shop.phone || '',
          email: shop.email || user.email || '',
          isLocal: shop.business_type === 'local' || shop.business_type === 'both',
          isMobile: shop.business_type === 'mobile' || shop.business_type === 'both',
          addressLine1: shop.address_line1 || '',
          addressCity: shop.address_city || '',
          addressPostalCode: shop.address_postal_code || '',
          addressCountry: shop.address_country || 'France',
          shopImageUrl: shop.shop_image_url || '',
          serviceZones: shop.service_zones || []
        });
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.email) return;

    setSaving(true);
    setError('');

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Le nom de l\'entreprise est requis');
      }
      if (formData.isLocal && !formData.addressLine1.trim()) {
        throw new Error('L\'adresse est requise pour un service local');
      }
      if (formData.isMobile && formData.serviceZones.length === 0) {
        throw new Error('Au moins une zone d\'intervention est requise pour un service mobile');
      }
      if (!formData.isLocal && !formData.isMobile) {
        throw new Error('Veuillez sélectionner au moins un type de service (local ou mobile)');
      }

      // Vérifier si le shop existe déjà
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('email', user.email)
        .single();

      // Déterminer le type de business
      let businessType = 'local';
      if (formData.isLocal && formData.isMobile) {
        businessType = 'both';
      } else if (formData.isMobile) {
        businessType = 'mobile';
      }

      const shopData = {
        email: user.email,
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        business_type: businessType,
        shop_image_url: formData.shopImageUrl || null,
        address_line1: formData.isLocal ? formData.addressLine1.trim() : null,
        address_city: formData.isLocal ? formData.addressCity.trim() || null : null,
        address_postal_code: formData.isLocal ? formData.addressPostalCode.trim() || null : null,
        address_country: formData.isLocal ? formData.addressCountry.trim() || 'France' : null,
        service_zones: formData.isMobile ? formData.serviceZones : null
      };

      if (existingShop) {
        // Mettre à jour
        const { error } = await supabase
          .from('shops')
          .update(shopData)
          .eq('id', existingShop.id);

        if (error) throw error;
      } else {
        // Créer
        const { error } = await supabase
          .from('shops')
          .insert([shopData]);

        if (error) throw error;
      }

      clearFormData();
      onNext();

    } catch (error: any) {
      console.error('Error saving shop info:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };


  const addServiceZone = () => {
    updateField({ serviceZones: [...formData.serviceZones, { city: '', radius: 10, unit: 'km' }] });
  };

  const removeServiceZone = (index: number) => {
    updateField({ serviceZones: formData.serviceZones.filter((_, i) => i !== index) });
  };

  const updateServiceZone = (index: number, field: 'city' | 'radius' | 'unit', value: string | number) => {
    updateField({
      serviceZones: formData.serviceZones.map((zone, i) =>
        i === index ? { ...zone, [field]: value } : zone
      )
    });
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.email) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Erreur: Utilisateur non connecté</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configuration de votre entreprise
        </h2>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Informations de l'entreprise</h3>
        </div>
        <p className="text-gray-600 mb-6">Ces informations apparaîtront sur vos factures et communications</p>
        <div className="space-y-6">
          {/* Photo du shop */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Photo de votre entreprise
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                {formData.shopImageUrl ? (
                  <img src={formData.shopImageUrl} alt="Shop" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="shopImageUpload"
                  className="hidden"
                  onChange={handleImageChange}
                  accept="image/*"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="shopImageUpload"
                  className={`inline-block bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadingImage ? 'Upload en cours...' : 'Ajouter une photo'}
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG ou HEIC (max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Nom de l'entreprise */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField({ name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Auto Clean Pro"
            />
          </div>

          {/* Téléphone et Email */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField({ phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email professionnel
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField({ email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@autoCleanPro.fr"
                />
              </div>
            </div>
          </div>

          {/* Type d'entreprise */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Type de service
            </label>
            <div className="space-y-4">
              {/* Service Local */}
              <div className={`
              p-4 border-2 rounded-lg transition-all
              ${formData.isLocal
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
                }
            `}>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isLocal}
                    onChange={(e) => updateField({ isLocal: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">J'accueille la clientèle dans un local</div>
                    <div className="text-sm text-gray-500">Vous accueillez vos clients dans un local</div>
                  </div>
                </label>

                {formData.isLocal && (
                  <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Adresse du local *
                      </label>
                      <input
                        type="text"
                        value={formData.addressLine1}
                        onChange={(e) => updateField({ addressLine1: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Rue de la Paix"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Ville
                        </label>
                        <input
                          type="text"
                          value={formData.addressCity}
                          onChange={(e) => updateField({ addressCity: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Paris"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Code postal
                        </label>
                        <input
                          type="text"
                          value={formData.addressPostalCode}
                          onChange={(e) => updateField({ addressPostalCode: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="75001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Pays
                        </label>
                        <input
                          type="text"
                          value={formData.addressCountry}
                          onChange={(e) => updateField({ addressCountry: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="France"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Mobile */}
              <div className={`
              p-4 border-2 rounded-lg transition-all
              ${formData.isMobile
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
                }
            `}>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isMobile}
                    onChange={(e) => {
                      const isMobile = e.target.checked;
                      updateField({ isMobile });

                      // Si on active le service mobile et qu'il n'y a pas de zones, en ajouter une
                      if (isMobile && formData.serviceZones.length === 0) {
                        updateField({
                          serviceZones: [{ city: '', radius: 10, unit: 'km' }]
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Je me déplace vers la clientèle</div>
                    <div className="text-sm text-gray-500">Vous vous déplacez chez vos clients</div>
                  </div>
                </label>

                {formData.isMobile && (
                  <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-700">
                        Zones d'intervention *
                      </label>
                    </div>

                    <div className="space-y-3">
                      {formData.serviceZones.map((zone, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={zone.city}
                              onChange={(e) => updateServiceZone(index, 'city', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Ville (ex: Paris)"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={zone.radius}
                              onChange={(e) => updateServiceZone(index, 'radius', parseInt(e.target.value) || 0)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="1"
                              max="100"
                            />
                            <select
                              value={zone.unit}
                              onChange={(e) => updateServiceZone(index, 'unit', e.target.value as 'km' | 'miles')}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="km">km</option>
                              <option value="miles">miles</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeServiceZone(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Bouton d'ajout à l'intérieur de la liste */}
                      <button
                        type="button"
                        onClick={addServiceZone}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Ajouter une zone d'intervention
                      </button>
                    </div>

                    {formData.serviceZones.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        Ajoutez au moins une zone d'intervention pour votre service mobile
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Retour
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : null}
          Sauvegarder et continuer
        </button>
      </div>
    </div>
  );
};

export default ShopInfoStep;
