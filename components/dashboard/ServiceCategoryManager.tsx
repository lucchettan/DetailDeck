import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon as XMarkIcon, TrashIcon, PencilIcon } from '../Icons';
import { ShopServiceCategory, ServiceCategoryFormData } from "../../types";
import { supabase } from '../../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../../lib/utils';
import { IS_MOCK_MODE } from '../../lib/env';
import { processImageFile } from '../../lib/heicUtils';

interface ServiceCategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  serviceCategories: ShopServiceCategory[];
  onUpdate?: (updatedCategories: ShopServiceCategory[]) => void;
  onDataUpdated?: () => void;
}


const ServiceCategoryManager: React.FC<ServiceCategoryManagerProps> = ({
  isOpen,
  onClose,
  shopId,
  serviceCategories: initialCategories,
  onUpdate,
  onDataUpdated,
}) => {
  const { t } = useLanguage();
  const [serviceCategories, setServiceCategories] = useState<ShopServiceCategory[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state for editing/adding
  const [formData, setFormData] = useState<ServiceCategoryFormData>({
    name: '',
    iconName: 'detailing',
    imageUrl: ''
  });

  useEffect(() => {
    setServiceCategories(initialCategories);
  }, [initialCategories]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      // Process the image file (validation + HEIC conversion)
      const processedFile = await processImageFile(file);

      // Validation supplémentaire : vérifier que le fichier n'est pas vide
      if (processedFile.size === 0) {
        throw new Error('Le fichier image est vide ou corrompu');
      }

      // Upload to Supabase Storage
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `category-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, processedFile);

      if (uploadError) {
        throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      iconName: 'detailing',
      imageUrl: ''
    });
    setEditingId(null);
    setIsAddingNew(false);
    setError(null);
  };

  const handleEdit = (category: ShopServiceCategory) => {
    setFormData({
      name: category.name,
      iconName: (category.iconName || category.icon_name) || 'detailing',
      imageUrl: category.imageUrl || category.image_url || ''
    });
    setEditingId(category.id);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      iconName: 'detailing',
      imageUrl: ''
    });
    setEditingId(null);
    setIsAddingNew(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Le nom de la catégorie est requis');
      return;
    }

    if (editingId && !serviceCategories.find(c => c.id === editingId)) {
      setError('Catégorie introuvable');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_MODE) {
        // Mock mode simulation
        const newCategory: ShopServiceCategory = {
          id: `mock-${Date.now()}`,
          shopId,
          name: formData.name,
          iconName: formData.iconName,
          imageUrl: formData.imageUrl,
          createdAt: new Date().toISOString()
        };

        if (isAddingNew) {
          setServiceCategories(prev => [...prev, newCategory]);
        } else if (editingId) {
          setServiceCategories(prev => prev.map(c => c.id === editingId ? newCategory : c));
        }
        resetForm();
        return;
      }

      const categoryData = {
        name: formData.name,
        icon_name: formData.iconName,
        image_url: formData.imageUrl,
      };

      if (isAddingNew) {
        const { data, error } = await supabase
          .from('shop_service_categories')
          .insert([{ shop_id: shopId, ...categoryData }])
          .select()
          .single();

        if (error) throw error;

        const newCategory = toCamelCase(data) as ShopServiceCategory;
        setServiceCategories(prev => [...prev, newCategory]);
      } else if (editingId) {
        const { data, error } = await supabase
          .from('shop_service_categories')
          .update(categoryData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;

        const updatedCategory = toCamelCase(data) as ShopServiceCategory;
        setServiceCategories(prev => prev.map(c => c.id === editingId ? updatedCategory : c));
      }

      resetForm();
    } catch (err: any) {
      console.error('Error saving service category:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
      // Ensure editingId is reset even if there was an error
      setEditingId(null);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;

    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_MODE) {
        setServiceCategories(prev => prev.filter(c => c.id !== categoryId));
        return;
      }

      const { error } = await supabase
        .from('shop_service_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setServiceCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (err: any) {
      console.error('Error deleting service category:', err);
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onUpdate) {
      onUpdate(serviceCategories);
    }
    if (onDataUpdated) {
      onDataUpdated();
    }
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Main Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Vos catégories</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                disabled={loading}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-gray-600 mb-6">Organisez vos services par catégories pour une meilleure présentation</p>

          {/* Categories List */}
          <div className="space-y-4">
            {serviceCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                {editingId === category.id ? (
                  // Edit mode - inline editing
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Modifier la catégorie</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            try {
                              setEditingId(null);
                              resetForm();
                            } catch (error) {
                              console.error('Error closing edit mode:', error);
                              setError('Erreur lors de la fermeture de l\'édition');
                            }
                          }}
                          disabled={loading}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Category Name */}
                      <div>
                        <label className="form-label">Nom de la catégorie *</label>
                        <input
                          value={formData?.name || ''}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="ex: Lavage Extérieur, Nettoyage Intérieur"
                          className="form-input"
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="form-label">Image de la catégorie</label>
                        <div className="flex items-center gap-4">
                          {formData?.imageUrl && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={formData.imageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept="image/*,.heic,.heif"
                              onChange={handleImageUpload}
                              className="hidden"
                              id={`image-upload-${category.id}`}
                            />
                            <label
                              htmlFor={`image-upload-${category.id}`}
                              className="btn btn-secondary cursor-pointer"
                            >
                              {uploadingImage ? 'Upload...' : formData?.imageUrl ? 'Changer' : 'Ajouter'}
                            </label>
                            {formData?.imageUrl && (
                              <button
                                type="button"
                                onClick={removeImage}
                                className="btn btn-outline text-red-600 hover:bg-red-50"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={loading}
                          className="btn btn-outline"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={loading || !formData?.name?.trim()}
                          className="btn btn-primary"
                        >
                          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {category.imageUrl || category.image_url ? (
                          <img
                            src={category.imageUrl || category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">🔧</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          try {
                            setFormData({
                              name: category.name || '',
                              iconName: (category.iconName || category.icon_name) || 'detailing',
                              imageUrl: category.imageUrl || category.image_url || ''
                            });
                            setEditingId(category.id);
                          } catch (error) {
                            console.error('Error setting form data:', error);
                            setError('Erreur lors de l\'ouverture de l\'édition');
                          }
                        }}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Button - Now at the end of the list */}
            {!isAddingNew && (
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                <button
                  onClick={handleAddNew}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 py-4 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Ajouter une nouvelle catégorie</span>
                </button>
              </div>
            )}

            {/* Add New Form - Only for adding new categories */}
            {isAddingNew && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Ajouter une nouvelle catégorie
                </h4>

                <div className="space-y-4">
                  {/* Category Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nom de la catégorie
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Intérieur, Extérieur, Détailing..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>

                  {/* Image Upload and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {formData.imageUrl ? (
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">📷</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="category-image-upload"
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="category-image-upload"
                          className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors cursor-pointer ${uploadingImage
                            ? 'text-blue-600 bg-blue-50 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                            }`}
                        >
                          {uploadingImage ? 'Upload...' : '📷 Ajouter une image'}
                        </label>
                        {formData.imageUrl && (
                          <button
                            type="button"
                            onClick={removeImage}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setIsAddingNew(false);
                          resetForm();
                        }}
                        disabled={loading}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading || !formData.name.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Sauvegarde...' : 'Ajouter'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Formats supportés: JPEG, PNG, WebP, HEIC • Max 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ServiceCategoryManager;
