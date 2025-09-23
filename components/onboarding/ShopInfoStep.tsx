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
  businessType: 'local' | 'mobile';
  addressLine1: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;
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
    businessType: 'local',
    addressLine1: '',
    addressCity: '',
    addressPostalCode: '',
    addressCountry: 'France'
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
          businessType: shop.business_type || 'local',
          addressLine1: shop.address_line1 || '',
          addressCity: shop.address_city || '',
          addressPostalCode: shop.address_postal_code || '',
          addressCountry: shop.address_country || 'France'
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
      if (!formData.addressLine1.trim()) {
        throw new Error('L\'adresse est requise');
      }

      // Vérifier si le shop existe déjà
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      const shopData = {
        owner_id: user.id,
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        business_type: formData.businessType,
        address_line1: formData.addressLine1.trim(),
        address_city: formData.addressCity.trim() || null,
        address_postal_code: formData.addressPostalCode.trim() || null,
        address_country: formData.addressCountry.trim() || 'France'
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

  const updateField = (field: keyof ShopInfoData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            Type d'entreprise
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`
              flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
              ${formData.businessType === 'local'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}>
              <input
                type="radio"
                name="businessType"
                value="local"
                checked={formData.businessType === 'local'}
                onChange={(e) => updateField('businessType', e.target.value as 'local' | 'mobile')}
                className="sr-only"
              />
              <div className="flex items-center">
                <div className={`
                  w-4 h-4 rounded-full border-2 mr-3
                  ${formData.businessType === 'local'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                  }
                `}>
                  {formData.businessType === 'local' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Entreprise locale</div>
                  <div className="text-sm text-gray-500">Les clients viennent chez vous</div>
                </div>
              </div>
            </label>

            <label className={`
              flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
              ${formData.businessType === 'mobile'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}>
              <input
                type="radio"
                name="businessType"
                value="mobile"
                checked={formData.businessType === 'mobile'}
                onChange={(e) => updateField('businessType', e.target.value as 'local' | 'mobile')}
                className="sr-only"
              />
              <div className="flex items-center">
                <div className={`
                  w-4 h-4 rounded-full border-2 mr-3
                  ${formData.businessType === 'mobile'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                  }
                `}>
                  {formData.businessType === 'mobile' && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Entreprise mobile</div>
                  <div className="text-sm text-gray-500">Vous vous déplacez chez les clients</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse *
          </label>
          <input
            type="text"
            value={formData.addressLine1}
            onChange={(e) => updateField('addressLine1', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            placeholder="123 Rue Principale"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={formData.addressCity}
              onChange={(e) => updateField('addressCity', e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ville"
            />
            <input
              type="text"
              value={formData.addressPostalCode}
              onChange={(e) => updateField('addressPostalCode', e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Code postal"
            />
            <input
              type="text"
              value={formData.addressCountry}
              onChange={(e) => updateField('addressCountry', e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Pays"
            />
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
