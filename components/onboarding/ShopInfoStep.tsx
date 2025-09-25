import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { ImageIcon, SaveIcon } from '../Icons';
import { useFormPersistence } from '../../hooks/useFormPersistence';

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

  // Persistance du formulaire
  const {
    formData,
    setFormData,
    handleSubmitSuccess
  } = useFormPersistence<ShopInfoData>('onboarding_shop_info', {
    name: '',
    phone: '',
    email: user?.email || '',
    isLocal: true,
    isMobile: false,
    addressLine1: '',
    addressCity: '',
    addressPostalCode: '',
    addressCountry: 'France',
    serviceZones: []
  });

  useEffect(() => {
    loadExistingData();
  }, [user]);

  const loadExistingData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
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
    if (!user?.id) return;

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
        .eq('owner_id', user.id)
        .single();

      // Déterminer le type de business
      let businessType = 'local';
      if (formData.isLocal && formData.isMobile) {
        businessType = 'both';
      } else if (formData.isMobile) {
        businessType = 'mobile';
      }

      const shopData = {
        owner_id: user.id,
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        business_type: businessType,
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

      handleSubmitSuccess();
      onNext();

    } catch (error: any) {
      console.error('Error saving shop info:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ShopInfoData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addServiceZone = () => {
    setFormData(prev => ({
      ...prev,
      serviceZones: [...prev.serviceZones, { city: '', radius: 10, unit: 'km' }]
    }));
  };

  const removeServiceZone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      serviceZones: prev.serviceZones.filter((_, i) => i !== index)
    }));
  };

  const updateServiceZone = (index: number, field: 'city' | 'radius' | 'unit', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      serviceZones: prev.serviceZones.map((zone, i) =>
        i === index ? { ...zone, [field]: value } : zone
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Informations de votre entreprise
        </h2>
        <p className="text-gray-600">
          Ces informations apparaîtront sur vos factures et dans les communications avec vos clients.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Nom de l'entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom de l'entreprise *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Auto Clean Pro"
          />
        </div>

        {/* Téléphone et Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="06 12 34 56 78"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email professionnel
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contact@autoCleanPro.fr"
            />
          </div>
        </div>

        {/* Type d'entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
                  onChange={(e) => updateField('isLocal', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">Service Local</div>
                  <div className="text-sm text-gray-500">Vous accueillez vos clients dans un local</div>
                </div>
              </label>
              
              {formData.isLocal && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse du local *
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine1}
                      onChange={(e) => updateField('addressLine1', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Rue de la Paix"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={formData.addressCity}
                        onChange={(e) => updateField('addressCity', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Paris"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code postal
                      </label>
                      <input
                        type="text"
                        value={formData.addressPostalCode}
                        onChange={(e) => updateField('addressPostalCode', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="75001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pays
                      </label>
                      <input
                        type="text"
                        value={formData.addressCountry}
                        onChange={(e) => updateField('addressCountry', e.target.value)}
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
                  onChange={(e) => updateField('isMobile', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">Service Mobile</div>
                  <div className="text-sm text-gray-500">Vous vous déplacez chez vos clients</div>
                </div>
              </label>
              
              {formData.isMobile && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Zones d'intervention *
                    </label>
                    <button
                      type="button"
                      onClick={addServiceZone}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Ajouter une zone
                    </button>
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
          ) : (
            <SaveIcon className="w-5 h-5" />
          )}
          Sauvegarder et continuer
        </button>
      </div>
    </div>
  );
};

export default ShopInfoStep;
