import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon as XMarkIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, CloseIcon as CancelIcon } from '../Icons';
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
    name: '',
    subtitle: '',
    iconUrl: '',
    isActive: true,
    displayOrder: 0
  });

  useEffect(() => {
    setSizes(vehicleSizes);
  }, [vehicleSizes]);

  const resetForm = () => {
    setFormData({
      name: '',
      subtitle: '',
      iconUrl: '',
      isActive: true,
      displayOrder: 0
    });
    setEditingId(null);
    setIsAddingNew(false);
    setError(null);
  };

  const handleEdit = (size: ShopVehicleSize) => {
    setFormData({
      name: size.name,
      subtitle: size.subtitle || '',
      iconUrl: size.iconUrl || '',
      isActive: size.isActive,
      displayOrder: size.displayOrder
    });
    setEditingId(size.id);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      subtitle: '',
      iconUrl: '',
      isActive: true,
      displayOrder: Math.max(...sizes.map(s => s.displayOrder), 0) + 1
    });
    setEditingId(null);
    setIsAddingNew(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Vehicle size name is required');
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
          subtitle: formData.subtitle,
          iconUrl: formData.iconUrl,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
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
            ...toSnakeCase(formData)
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
          .update(toSnakeCase(formData))
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
      setError(err.message || 'Failed to save vehicle size');
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
      setError(err.message || 'Failed to delete vehicle size');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (size: ShopVehicleSize) => {
    const updatedActive = !size.isActive;

    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_MODE) {
        setSizes(prev => prev.map(s =>
          s.id === size.id ? { ...s, isActive: updatedActive } : s
        ));
        return;
      }

      const { data, error } = await supabase
        .from('shop_vehicle_sizes')
        .update({ is_active: updatedActive })
        .eq('id', size.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSize = toCamelCase(data) as ShopVehicleSize;
      setSizes(prev => prev.map(s => s.id === size.id ? updatedSize : s));

    } catch (err: any) {
      console.error('Error toggling vehicle size:', err);
      setError(err.message || 'Failed to update vehicle size');
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
              Manage Vehicle Sizes
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
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
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((size) => (
              <div
                key={size.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${size.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={size.isActive}
                      onChange={() => handleToggleActive(size)}
                      disabled={loading}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${size.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {size.name}
                    </h3>
                    {size.subtitle && (
                      <p className={`text-sm ${size.isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                        {size.subtitle}
                      </p>
                    )}
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
              </div>
            ))}
        </div>

        {/* Add/Edit Form */}
        {(isAddingNew || editingId) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isAddingNew ? t.addNewVehicleSize : 'Edit Vehicle Size'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Motorcycle, Truck"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g., Honda CBR, Ford F-150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (available for booking)
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetForm}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <CancelIcon className="w-4 h-4 mr-2 inline" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className="w-4 h-4 mr-2 inline" />
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Add New Button */}
        {!isAddingNew && !editingId && (
          <button
            onClick={handleAddNew}
            disabled={loading}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>{t.addNewVehicleSize}</span>
          </button>
        )}
      </div>
    </>
  );

  // Return content wrapped in modal or directly
  return embedded ? (
    content
  ) : (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {content}
      </div>
    </div>
  );
};

export default VehicleSizeManager;
