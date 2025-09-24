import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Category {
  id?: string;
  name: string;
  isActive: boolean;
}

interface CategoriesStepProps {
  onBack: () => void;
  onNext: () => void;
}

const CategoriesStep: React.FC<CategoriesStepProps> = ({ onBack, onNext }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([
    { name: 'Intérieur', isActive: true },
    { name: 'Extérieur', isActive: true }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    fetchShopData();
  }, [user]);

  const fetchShopData = async () => {
    if (!user) return;

    try {
      const { data: shopData, error } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
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
          isActive: cat.is_active || true
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
        name: cat.name.trim()
      }));

      const { error } = await supabase
        .from('shop_service_categories')
        .insert(categoriesToInsert);

      if (error) throw error;
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

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Vos catégories</h3>
          <button
            onClick={addCategory}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <PlusIcon className="w-4 h-4" />
            Ajouter une catégorie
          </button>
        </div>

        <div className="space-y-4">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Nom de la catégorie (ex: Intérieur)"
                  value={category.name}
                  onChange={(e) => updateCategory(index, 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={category.isActive}
                    onChange={(e) => updateCategory(index, 'isActive', e.target.checked)}
                    className="mr-2"
                  />
                  Active
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
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Suggestions de catégories</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
            <span>• Intérieur</span>
            <span>• Extérieur</span>
            <span>• Détailing</span>
            <span>• Protection</span>
            <span>• Réparation</span>
            <span>• Entretien</span>
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
