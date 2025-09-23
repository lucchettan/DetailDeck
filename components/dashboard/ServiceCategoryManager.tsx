import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon as XMarkIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, CloseIcon as CancelIcon } from '../Icons';
import { ShopServiceCategory, ServiceCategoryFormData, AVAILABLE_CATEGORY_ICONS, CategoryIconName } from "../../types";
import { supabase } from '../../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../../lib/utils';
import { IS_MOCK_MODE } from '../../lib/env';

interface ServiceCategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  serviceCategories: ShopServiceCategory[];
  onUpdate?: (updatedCategories: ShopServiceCategory[]) => void;
  onDataUpdated?: () => void;
  embedded?: boolean; // New prop for embedded mode
}

const CATEGORY_ICON_DISPLAY: Record<CategoryIconName, { icon: string; label: string }> = {
  interior: { icon: '🏠', label: 'Interior' },
  exterior: { icon: '✨', label: 'Exterior' },
  engine: { icon: '⚙️', label: 'Engine' },
  wheels: { icon: '🛞', label: 'Wheels' },
  detailing: { icon: '🧽', label: 'Detailing' },
  protection: { icon: '🛡️', label: 'Protection' },
  maintenance: { icon: '🔧', label: 'Maintenance' },
};

const ServiceCategoryManager: React.FC<ServiceCategoryManagerProps> = ({
  isOpen,
  onClose,
  shopId,
  serviceCategories: initialCategories,
  onUpdate,
  onDataUpdated,
  embedded = false
}) => {
  const { t } = useLanguage();
  const [serviceCategories, setServiceCategories] = useState<ShopServiceCategory[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing/adding
  const [formData, setFormData] = useState<ServiceCategoryFormData>({
    name: '',
    iconName: 'detailing',
    iconUrl: '',
    isActive: true,
    displayOrder: 0
  });

  useEffect(() => {
    setServiceCategories(initialCategories);
  }, [initialCategories]);

  const resetForm = () => {
    setFormData({
      name: '',
      iconName: 'detailing',
      iconUrl: '',
      isActive: true,
      displayOrder: 0
    });
    setEditingId(null);
    setIsAddingNew(false);
    setError(null);
  };

  const handleEdit = (category: ShopServiceCategory) => {
    setFormData({
      name: category.name,
      iconName: (category.iconName as CategoryIconName) || 'detailing',
      iconUrl: category.iconUrl || '',
      isActive: category.isActive,
      displayOrder: category.displayOrder
    });
    setEditingId(category.id);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      iconName: 'detailing',
      iconUrl: '',
      isActive: true,
      displayOrder: Math.max(...serviceCategories.map(c => c.displayOrder), 0) + 1
    });
    setEditingId(null);
    setIsAddingNew(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required');
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
          iconUrl: formData.iconUrl,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
          createdAt: new Date().toISOString()
        };

        if (isAddingNew) {
          setServiceCategories(prev => [...prev, newCategory]);
        } else if (editingId) {
          setServiceCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } : c));
        }

        resetForm();
        return;
      }

      if (isAddingNew) {
        // Create new service category
        const { data, error } = await supabase
          .from('shop_service_categories')
          .insert([{
            shop_id: shopId,
            ...toSnakeCase(formData)
          }])
          .select()
          .single();

        if (error) throw error;

        const newCategory = toCamelCase(data) as ShopServiceCategory;
        setServiceCategories(prev => [...prev, newCategory]);

      } else if (editingId) {
        // Update existing service category
        const { data, error } = await supabase
          .from('shop_service_categories')
          .update(toSnakeCase(formData))
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
      setError(err.message || 'Failed to save service category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone and may affect existing services.')) {
      return;
    }

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
      setError(err.message || 'Failed to delete service category');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category: ShopServiceCategory) => {
    const updatedActive = !category.isActive;

    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_MODE) {
        setServiceCategories(prev => prev.map(c =>
          c.id === category.id ? { ...c, isActive: updatedActive } : c
        ));
        return;
      }

      const { data, error } = await supabase
        .from('shop_service_categories')
        .update({ is_active: updatedActive })
        .eq('id', category.id)
        .select()
        .single();

      if (error) throw error;

      const updatedCategory = toCamelCase(data) as ShopServiceCategory;
      setServiceCategories(prev => prev.map(c => c.id === category.id ? updatedCategory : c));

    } catch (err: any) {
      console.error('Error toggling service category:', err);
      setError(err.message || 'Failed to update service category');
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
    onClose();
  };

  const getIconDisplay = (iconName?: string) => {
    const icon = CATEGORY_ICON_DISPLAY[iconName as CategoryIconName] || CATEGORY_ICON_DISPLAY.detailing;
    return icon.icon;
  };

  if (!isOpen) return null;

  const content = (
    <>
      {/* Header - only show in modal mode */}
      {!embedded && (
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              📋
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Service Categories
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

        {/* Service Categories List */}
        <div className="space-y-3 mb-6">
          {serviceCategories
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((category) => (
              <div
                key={category.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${category.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={category.isActive}
                      onChange={() => handleToggleActive(category)}
                      disabled={loading}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getIconDisplay(category.iconName)}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${category.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
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
            ))}
        </div>

        {/* Add/Edit Form */}
        {(isAddingNew || editingId) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isAddingNew ? 'Add New Service Category' : 'Edit Service Category'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Engine Bay Services, Paint Protection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {AVAILABLE_CATEGORY_ICONS.map((iconKey) => {
                    const iconInfo = CATEGORY_ICON_DISPLAY[iconKey];
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, iconName: iconKey }))}
                        className={`p-3 border rounded-lg text-center transition-colors ${formData.iconName === iconKey
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                          }`}
                        disabled={loading}
                      >
                        <div className="text-2xl mb-1">{iconInfo.icon}</div>
                        <div className="text-xs text-gray-600">{iconInfo.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="categoryIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  disabled={loading}
                />
                <label htmlFor="categoryIsActive" className="ml-2 text-sm text-gray-700">
                  Active (available for new services)
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
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add New Service Category</span>
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

export default ServiceCategoryManager;
