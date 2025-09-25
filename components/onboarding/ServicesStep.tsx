import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ImageIcon } from '../Icons';

interface ServicesStepProps {
  onBack: () => void;
  onNext: () => void;
}

interface Service {
  id?: string;
  name: string;
  description: string;
  category_id: string;
  base_price: number;
  base_duration: number;
  image_url?: string;
}

interface Category {
  id: string;
  name: string;
}

const ServicesStep: React.FC<ServicesStepProps> = ({ onBack, onNext }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchShopAndCategories();
  }, [user]);

  const fetchShopAndCategories = async () => {
    if (!user) return;

    try {
      // Récupérer le shop
      const { data: shopData } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (shopData) {
        setShopId(shopData.id);

        // Récupérer les catégories
        const { data: categoriesData } = await supabase
          .from('shop_service_categories')
          .select('*')
          .eq('shop_id', shopData.id);

        setCategories(categoriesData || []);

        // Récupérer les services existants
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('shop_id', shopData.id);

        if (servicesData && servicesData.length > 0) {
          setServices(servicesData.map(service => ({
            id: service.id,
            name: service.name || '',
            description: service.description || '',
            category_id: service.category_id || '',
            base_price: service.base_price || 0,
            base_duration: service.base_duration || 30
          })));
        } else {
          // Créer un service par défaut pour chaque catégorie
          const defaultServices = categoriesData?.map(category => ({
            name: category.name === 'Intérieur' ? 'Nettoyage intérieur complet' : 'Lavage extérieur',
            description: category.name === 'Intérieur' 
              ? 'Aspirateur, nettoyage des sièges et tableau de bord'
              : 'Lavage carrosserie, jantes et vitres',
            category_id: category.id,
            base_price: category.name === 'Intérieur' ? 25 : 15,
            base_duration: category.name === 'Intérieur' ? 45 : 30,
            image_url: ''
          })) || [];

          setServices(defaultServices);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const addService = () => {
    if (categories.length === 0) return;

    setServices([...services, {
      name: '',
      description: '',
      category_id: categories[0].id,
      base_price: 20,
      base_duration: 30,
      image_url: ''
    }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    const updatedServices = [...services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setServices(updatedServices);
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!shopId) return;

    setUploadingImages(prev => ({ ...prev, [index]: true }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/services/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      updateService(index, 'image_url', publicUrl);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const saveServices = async () => {
    if (!shopId || services.length === 0) return;

    setLoading(true);
    try {
      // Supprimer les services existants pour cette étape d'onboarding
      await supabase
        .from('services')
        .delete()
        .eq('shop_id', shopId);

      // Créer les nouveaux services
      const servicesToInsert = services.map(service => ({
        shop_id: shopId,
        category_id: service.category_id,
        name: service.name,
        description: service.description,
        base_price: service.base_price,
        base_duration: service.base_duration,
        image_url: service.image_url || null,
        is_active: true
      }));

      const { error } = await supabase
        .from('services')
        .insert(servicesToInsert);

      if (error) throw error;

      onNext();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des services');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = services.length > 0 && services.every(service =>
    service.name.trim() && service.category_id && service.base_price > 0
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Créez vos premiers services
        </h2>
        <p className="text-lg text-gray-600">
          Définissez les services que vous proposez. Vous pourrez en ajouter d'autres plus tard.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            Vous devez d'abord créer des catégories de services dans l'étape précédente.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {services.map((service, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Service {index + 1}
                </h3>
                {services.length > 1 && (
                  <button
                    onClick={() => removeService(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => updateService(index, 'name', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Nettoyage intérieur complet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={service.category_id}
                    onChange={(e) => updateService(index, 'category_id', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix de base (€) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={service.base_price}
                    onChange={(e) => updateService(index, 'base_price', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="20.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (minutes) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={service.base_duration}
                    onChange={(e) => updateService(index, 'base_duration', parseInt(e.target.value) || 30)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="30"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={service.description}
                    onChange={(e) => updateService(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Décrivez ce service en détail..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo du service
                  </label>
                  <div className="flex items-center space-x-4">
                    {service.image_url ? (
                      <div className="relative">
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => updateService(index, 'image_url', '')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(index, file);
                        }}
                        className="hidden"
                        id={`image-upload-${index}`}
                        disabled={uploadingImages[index]}
                      />
                      <label
                        htmlFor={`image-upload-${index}`}
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                          uploadingImages[index] ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadingImages[index] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Upload en cours...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {service.image_url ? 'Changer la photo' : 'Ajouter une photo'}
                          </>
                        )}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG jusqu'à 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addService}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Ajouter un service
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Retour
        </button>

        <div className="text-sm text-gray-500">
          {services.length} service{services.length !== 1 ? 's' : ''} configuré{services.length !== 1 ? 's' : ''}
        </div>

        <button
          onClick={saveServices}
          disabled={!canProceed || loading}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${canProceed && !loading
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {loading ? 'Sauvegarde...' : 'Terminer l\'onboarding'}
        </button>
      </div>
    </div>
  );
};

export default ServicesStep;
