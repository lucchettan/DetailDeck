import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrashIcon, SaveIcon, ImageIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import { processImageFile } from '../../lib/heicUtils';
import { IS_MOCK_MODE } from '../../lib/env';

interface ServiceEditorOnboardingProps {
  service: any;
  serviceIndex: number;
  categories: any[];
  vehicleSizes: any[];
  onUpdate: (index: number, service: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const ServiceEditorOnboarding: React.FC<ServiceEditorOnboardingProps> = ({
  service,
  serviceIndex,
  categories,
  vehicleSizes,
  onUpdate,
  onRemove,
  canRemove
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(service);
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({});
  const [showHeicInstructions, setShowHeicInstructions] = useState(false);

  useEffect(() => {
    setFormData(service);
  }, [service]);

  const handleInputChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(serviceIndex, newData);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, imageIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImages(prev => ({ ...prev, [imageIndex]: true }));

    try {
      // Process the image file (validation + HEIC conversion)
      const processedFile = await processImageFile(file);

      // Upload to Supabase Storage
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${imageIndex}.${fileExt}`;
      const filePath = `onboarding-services/${fileName}`;

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

      // Update the service with the new image
      const newImageUrls = [...(formData.image_urls || [])];
      newImageUrls[imageIndex] = publicUrl;
      handleInputChange('image_urls', newImageUrls);

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      if (error instanceof Error && error.message.includes('HEIC')) {
        setShowHeicInstructions(true);
      }
    } finally {
      setUploadingImages(prev => ({ ...prev, [imageIndex]: false }));
    }
  };

  const removeImage = (imageIndex: number) => {
    const newImageUrls = [...(formData.image_urls || [])];
    newImageUrls.splice(imageIndex, 1);
    handleInputChange('image_urls', newImageUrls);
  };

  const addImageSlot = () => {
    if ((formData.image_urls || []).length < 4) {
      const newImageUrls = [...(formData.image_urls || []), ''];
      handleInputChange('image_urls', newImageUrls);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Service {serviceIndex + 1}
        </h3>
        {canRemove && (
          <button
            onClick={() => onRemove(serviceIndex)}
            className="text-red-500 hover:text-red-700"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Nom du service */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Nom du service *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Nettoyage intérieur complet"
          />
        </div>

        {/* Catégorie, Prix, Durée */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Catégorie *
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Prix de base (€) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.base_price || ''}
              onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="20.00"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Durée (minutes) *
            </label>
            <input
              type="number"
              min="5"
              step="5"
              value={formData.base_duration || ''}
              onChange={(e) => handleInputChange('base_duration', parseInt(e.target.value) || 30)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="30"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Décrivez ce service en détail..."
          />
        </div>

        {/* Variations par taille de véhicule */}
        {vehicleSizes.length > 1 && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Variations par taille de véhicule
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Définissez des prix et durées supplémentaires pour chaque taille de véhicule
            </p>
            <div className="space-y-3">
              {vehicleSizes.map((vehicleSize) => (
                <div key={vehicleSize.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-700">{vehicleSize.name}</div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Prix supplémentaire (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.vehicle_size_variations?.[vehicleSize.id]?.price || 0}
                      onChange={(e) => {
                        const variations = { ...formData.vehicle_size_variations };
                        if (!variations[vehicleSize.id]) variations[vehicleSize.id] = {};
                        variations[vehicleSize.id].price = parseFloat(e.target.value) || 0;
                        handleInputChange('vehicle_size_variations', variations);
                      }}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Durée supplémentaire (min)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={formData.vehicle_size_variations?.[vehicleSize.id]?.duration || 0}
                      onChange={(e) => {
                        const variations = { ...formData.vehicle_size_variations };
                        if (!variations[vehicleSize.id]) variations[vehicleSize.id] = {};
                        variations[vehicleSize.id].duration = parseInt(e.target.value) || 0;
                        handleInputChange('vehicle_size_variations', variations);
                      }}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons spécifiques */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Add-ons spécifiques
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Ajoutez des options supplémentaires pour ce service
          </p>
          <div className="space-y-3">
            {(formData.specific_addons || []).map((addOn: any, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nom</label>
                  <input
                    type="text"
                    value={addOn.name || ''}
                    onChange={(e) => {
                      const addOns = [...(formData.specific_addons || [])];
                      addOns[index] = { ...addOns[index], name: e.target.value };
                      handleInputChange('specific_addons', addOns);
                    }}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Cire"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Prix (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={addOn.price || ''}
                    onChange={(e) => {
                      const addOns = [...(formData.specific_addons || [])];
                      addOns[index] = { ...addOns[index], price: parseFloat(e.target.value) || 0 };
                      handleInputChange('specific_addons', addOns);
                    }}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Durée (min)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={addOn.duration || ''}
                    onChange={(e) => {
                      const addOns = [...(formData.specific_addons || [])];
                      addOns[index] = { ...addOns[index], duration: parseInt(e.target.value) || 0 };
                      handleInputChange('specific_addons', addOns);
                    }}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      const addOns = [...(formData.specific_addons || [])];
                      addOns.splice(index, 1);
                      handleInputChange('specific_addons', addOns);
                    }}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const addOns = [...(formData.specific_addons || []), { name: '', price: 0, duration: 0 }];
                handleInputChange('specific_addons', addOns);
              }}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Ajouter un add-on
            </button>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Photos du service {(formData.image_urls || []).filter(Boolean).length}/4
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(formData.image_urls || []).map((imageUrl: string, index: number) => (
              <div key={index} className="relative">
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={`Service ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      onChange={(e) => handleImageUpload(e, index)}
                      className="hidden"
                      id={`image-upload-${serviceIndex}-${index}`}
                      disabled={uploadingImages[index]}
                    />
                    <label
                      htmlFor={`image-upload-${serviceIndex}-${index}`}
                      className="cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      {uploadingImages[index] ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-xs">Ajouter</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            ))}
            {(formData.image_urls || []).length < 4 && (
              <button
                type="button"
                onClick={addImageSlot}
                className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400"
              >
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceEditorOnboarding;
