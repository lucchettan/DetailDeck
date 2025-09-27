import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon as XMarkIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, CancelIcon } from '../Icons';
import { ShopVehicleSize, VehicleSizeFormData } from "../../types";
import { supabase } from '../../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../../lib/utils';
import { IS_MOCK_MODE } from '../../lib/env';

interface VehicleSizeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  vehicleSizes: ShopVehicleSize[];
  onUpdate?: (updatedSizes: ShopVehicleSize[]) => void;
  onNewVehicleSizeAdded?: (newSize: ShopVehicleSize) => void;
  onDataUpdated?: () => void;
  embedded?: boolean; // New prop for embedded mode
}

const VehicleSizeManager: React.FC<VehicleSizeManagerProps> = ({
  isOpen,
  onClose,
  shopId,
  vehicleSizes,
  onUpdate,
  onNewVehicleSizeAdded,
  onDataUpdated,
  embedded = false
}) => {
  const { t } = useLanguage();
  const [sizes, setSizes] = useState<ShopVehicleSize[]>(vehicleSizes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing/adding
  const [formData, setFormData] = useState<VehicleSizeFormData>({
    name: ''
  });

  useEffect(() => {
    setSizes(vehicleSizes);
  }, [vehicleSizes]);

  const resetForm = () => {
    setFormData({
      name: ''
    });
    setEditingId(null);
    setIsAddingNew(false);
    setError(null);
  };

  const handleEdit = (size: ShopVehicleSize) => {
    setFormData({
      name: size.name
    });
    setEditingId(size.id);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setFormData({
      name: ''
    });
    setEditingId(null);
    setIsAddingNew(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Le nom de la taille de véhicule est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_MODE) {
        // Mock mode simulation
        const newSize: ShopVehicleSize = {
          id: `mock-${Date.now()}`,
          shopId,
          name: formData.name,
          createdAt: new Date().toISOString()
        };

        if (isAddingNew) {
          setSizes(prev => [...prev, newSize]);

          // Trigger alert for updating existing services (even in mock mode)
          if (onNewVehicleSizeAdded) {
            onNewVehicleSizeAdded(newSize);
          }
        } else if (editingId) {
          setSizes(prev => prev.map(s => s.id === editingId ? { ...s, ...formData } : s));
        }

        resetForm();
        return;
      }

      if (isAddingNew) {
        // Create new vehicle size
        const { data, error } = await supabase
          .from('shop_vehicle_sizes')
          .insert([{
            shop_id: shopId,
            name: formData.name
          }])
          .select()
          .single();

        if (error) throw error;

        const newSize = toCamelCase(data) as ShopVehicleSize;
        setSizes(prev => [...prev, newSize]);

        // Trigger alert for updating existing services
        if (onNewVehicleSizeAdded) {
          onNewVehicleSizeAdded(newSize);
        }

      } else if (editingId) {
        // Update existing vehicle size
        const { data, error } = await supabase
          .from('shop_vehicle_sizes')
          .update({
            name: formData.name
          })
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;

        const updatedSize = toCamelCase(data) as ShopVehicleSize;
        setSizes(prev => prev.map(s => s.id === editingId ? updatedSize : s));
      }

      resetForm();

    } catch (err: any) {
      console.error('Error saving vehicle size:', err);
      setError(err.message || 'Erreur lors de la sauvegarde de la taille de véhicule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sizeId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle size? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_MODE) {
        setSizes(prev => prev.filter(s => s.id !== sizeId));
        return;
      }

      const { error } = await supabase
        .from('shop_vehicle_sizes')
        .delete()
        .eq('id', sizeId);

      if (error) throw error;

      setSizes(prev => prev.filter(s => s.id !== sizeId));

    } catch (err: any) {
      console.error('Error deleting vehicle size:', err);
      setError(err.message || 'Erreur lors de la suppression de la taille de véhicule');
    } finally {
      setLoading(false);
    }
  };


  const handleClose = () => {
    if (onUpdate) {
      onUpdate(sizes);
    }
    if (onDataUpdated) {
      onDataUpdated();
    }
    onClose();
  };

  if (!isOpen) return null;

  const content = (
    <>
      {/* Header - only show in modal mode */}
      {!embedded && (
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              🚗
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gérer les tailles de véhicules
            </h2>
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
      )}

      {/* Content */}
      <div className={embedded ? "" : "p-6 overflow-y-auto max-h-[calc(90vh-140px)]"}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Vehicle Sizes List */}
        <div className="space-y-3 mb-6">
          {sizes
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((size) => (
              <div
                key={size.id}
                className="flex items-center justify-between p-4 border border-gray-200 bg-white rounded-lg"
              >
                {editingId === size.id ? (
                  // Edit mode - inline editing
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      onClick={handleSave}
                      disabled={loading || !formData.name.trim()}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={resetForm}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <CancelIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {size.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(size)}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(size.id)}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>

        {/* Add New Button - Now at the end of the list */}
        {!isAddingNew && (
          <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <button
              onClick={handleAddNew}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 py-4 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="font-medium">Ajouter une nouvelle taille de véhicule</span>
            </button>
          </div>
        )}

        {/* Add New Form */}
        {isAddingNew && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ajouter une taille de véhicule
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: Citadine, Berline, SUV"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetForm}
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
        )}

      </div>
    </>
  );

  // Return content wrapped in modal or directly
  return embedded ? (
    content
  ) : (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-blue-100">
        {content}
      </div>
    </div>
  );
};

export default VehicleSizeManager;
