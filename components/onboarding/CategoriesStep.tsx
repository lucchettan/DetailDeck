import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { TrashIcon } from '@heroicons/react/24/outline';
import { processImageFile } from '../../lib/heicUtils';

interface Category {
  id?: string;
  name: string;
  isActive: boolean;
  image_url?: string;
}

interface CategoriesStepProps {
  onBack: () => void;
  onNext: () => void;
  shopId?: string | null;
  categories?: any[];
  onDataUpdate?: (data: any[]) => void;
}

const CategoriesStep: React.FC<CategoriesStepProps> = ({
  onBack,
  onNext,
  shopId: propShopId,
  categories: propCategories,
  onDataUpdate
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([
    { name: 'Intérieur', isActive: true },
    { name: 'Extérieur', isActive: true }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Si on a des props, les utiliser directement
    if (propShopId && propCategories) {
      console.log('📦 CategoriesStep: Using props data');
      setShopId(propShopId);
      setCategories(propCategories);
    } else {
      // Fallback: fetch si pas de props
      console.log('🔄 CategoriesStep: No props, fetching data...');
      fetchShopData();
    }
  }, [propShopId, propCategories]);

  const fetchShopData = async () => {
    if (!user) return;

    try {
      const { data: shopData, error } = await supabase
        .from('shops')
        .select('id')
        .eq('email', user.email)
        .single();

      if (error) throw error;
      if (shopData) {
        setShopId(shopData.id);
        fetchCategories(shopData.id);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du shop:', error);
    }
  };

  const fetchCategories = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('shop_service_categories')
        .select('*')
        .eq('shop_id', shopId);

      if (error) throw error;
      if (data && data.length > 0) {
        setCategories(data.map(cat => ({
          id: cat.id,
          name: cat.name,
          isActive: cat.is_active || true,
          image_url: cat.image_url || undefined
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
    }
  };

  const addCategory = () => {
    setCategories(prev => [...prev, { name: '', isActive: true }]);
  };

  const removeCategory = (index: number) => {
    setCategories(prev => prev.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: keyof Category, value: string | boolean) => {
    setCategories(prev => prev.map((cat, i) =>
      i === index ? { ...cat, [field]: value } : cat
    ));
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!user || !shopId) return;

    setUploadingImages(prev => ({ ...prev, [index]: true }));

    try {
      // Process the image file (validation + HEIC conversion)
      const processedFile = await processImageFile(file);

      // Validation supplémentaire : vérifier que le fichier n'est pas vide
      if (processedFile.size === 0) {
        throw new Error('Le fichier image est vide ou corrompu');
      }

      // Validation supplémentaire : vérifier que c'est bien une image
      if (!processedFile.type.startsWith('image/')) {
        throw new Error('Le fichier n\'est pas une image valide');
      }

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${shopId}/categories/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(fileName, processedFile);

      if (error) {
        // Fallback vers le bucket avatars si service-images n'existe pas
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('avatars')
          .upload(fileName, processedFile);

        if (fallbackError) throw fallbackError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        updateCategory(index, 'image_url', publicUrl);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('service-images')
          .getPublicUrl(fileName);

        updateCategory(index, 'image_url', publicUrl);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const removeImage = (index: number) => {
    updateCategory(index, 'image_url', '');
  };

  const handleSave = async () => {
    if (!user || !shopId) return;

    // Validation
    const validCategories = categories.filter(cat => cat.name.trim() !== '');
    if (validCategories.length === 0) {
      alert('Veuillez ajouter au moins une catégorie');
      return;
    }

    setIsSaving(true);
    try {
      // Supprimer les anciennes catégories
      await supabase
        .from('shop_service_categories')
        .delete()
        .eq('shop_id', shopId);

      // Ajouter les nouvelles catégories
      const categoriesToInsert = validCategories.map(cat => ({
        shop_id: shopId,
        name: cat.name.trim(),
        image_url: cat.image_url || null,
        is_active: cat.isActive
      }));

      const { error } = await supabase
        .from('shop_service_categories')
        .insert(categoriesToInsert);

      if (error) throw error;

      // Notifier le parent des nouvelles données
      if (onDataUpdate) {
        onDataUpdate(categoriesToInsert);
      }

      onNext();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des catégories');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Catégories de services</h2>
        <p className="text-gray-600">Organisez vos services par catégories (ex: Intérieur, Extérieur, Détailing, etc.)</p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
        <div className="mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Vos catégories</h3>
          </div>
        </div>
        <p className="text-gray-600 mb-6">Organisez vos services par catégories pour une meilleure présentation</p>

        <div className="space-y-4">
          {categories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="space-y-3">
                {/* Nom de la catégorie */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Intérieur, Extérieur, Détailing..."
                    value={category.name}
                    onChange={(e) => updateCategory(index, 'name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Actions horizontales */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {category.image_url ? (
                      <div className="relative">
                        <img
                          src={category.image_url}
                          alt="Image de catégorie"
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(index, file);
                          }}
                          className="hidden"
                          id={`image-upload-${index}`}
                        />
                        <label
                          htmlFor={`image-upload-${index}`}
                          className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${uploadingImages[index]
                            ? 'text-blue-600 bg-blue-50 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer'
                            }`}
                        >
                          {uploadingImages[index] ? (
                            <span className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              Conversion...
                            </span>
                          ) : (
                            '📷 Ajouter image'
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-gray-700">
                        {category.isActive ? 'Active' : 'Inactive'}
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.isActive}
                          onChange={(e) => updateCategory(index, 'isActive', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${category.isActive ? 'bg-green-600' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${category.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                      </label>
                    </div>

                    {categories.length > 1 && (
                      <button
                        onClick={() => removeCategory(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Bouton d'ajout à l'intérieur de la liste */}
          <button
            onClick={addCategory}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter une catégorie
          </button>
        </div>

        <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-3">💡 Suggestions de catégories</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">
            <span><strong>•</strong> Intérieur</span>
            <span><strong>•</strong> Extérieur</span>
            <span><strong>•</strong> Détailing</span>
            <span><strong>•</strong> Protection</span>
            <span><strong>•</strong> Réparation</span>
            <span><strong>•</strong> Entretien</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Retour
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || categories.filter(cat => cat.name.trim()).length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {isSaving ? 'Sauvegarde...' : 'Continuer →'}
        </button>
      </div>
    </div>
  );
};

export default CategoriesStep;
