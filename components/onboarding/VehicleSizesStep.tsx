import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { TrashIcon } from '@heroicons/react/24/outline';

interface VehicleSize {
  id?: string;
  name: string;
  description: string;
}

interface VehicleSizesStepProps {
  onBack: () => void;
  onNext: () => void;
  shopId?: string | null;
  vehicleSizes?: any[];
  onDataUpdate?: (data: any[]) => void;
}

const VehicleSizesStep: React.FC<VehicleSizesStepProps> = ({
  onBack,
  onNext,
  shopId: propShopId,
  vehicleSizes: propVehicleSizes,
  onDataUpdate
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([
    { name: 'Citadine', description: 'Petites voitures urbaines (Clio, 208, Polo, etc.)' },
    { name: 'Berline', description: 'Voitures de taille moyenne (Mégane, 308, Golf, etc.)' },
    { name: 'Break/SUV', description: 'Breaks et SUV compacts (Scenic, 3008, Tiguan, etc.)' },
    { name: '4x4/Minivan', description: 'Gros véhicules (Espace, X5, Sharan, etc.)' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    // Si on a des props, les utiliser directement
    if (propShopId && propVehicleSizes) {
      console.log('📦 VehicleSizesStep: Using props data');
      setShopId(propShopId);
      setVehicleSizes(propVehicleSizes);
    } else {
      // Fallback: fetch si pas de props
      console.log('🔄 VehicleSizesStep: No props, fetching data...');
      fetchShopData();
    }
  }, [propShopId, propVehicleSizes]);

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
        fetchVehicleSizes(shopData.id);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du shop:', error);
    }
  };

  const fetchVehicleSizes = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('shop_vehicle_sizes')
        .select('*')
        .eq('shop_id', shopId);

      if (error) throw error;
      if (data && data.length > 0) {
        setVehicleSizes(data.map(size => ({
          id: size.id,
          name: size.name,
          description: size.description || ''
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des tailles:', error);
    }
  };

  const addVehicleSize = () => {
    setVehicleSizes(prev => [...prev, { name: '', description: '' }]);
  };

  const removeVehicleSize = (index: number) => {
    setVehicleSizes(prev => prev.filter((_, i) => i !== index));
  };

  const updateVehicleSize = (index: number, field: keyof VehicleSize, value: string) => {
    setVehicleSizes(prev => prev.map((size, i) =>
      i === index ? { ...size, [field]: value } : size
    ));
  };

  const handleSave = async () => {
    if (!user || !shopId) return;

    // Validation
    const validSizes = vehicleSizes.filter(size => size.name.trim() !== '');
    if (validSizes.length === 0) {
      alert('Veuillez ajouter au moins une taille de véhicule');
      return;
    }

    setIsSaving(true);
    try {
      // Supprimer les anciennes tailles
      await supabase
        .from('shop_vehicle_sizes')
        .delete()
        .eq('shop_id', shopId);

      // Ajouter les nouvelles tailles
      const sizesToInsert = validSizes.map(size => ({
        shop_id: shopId,
        name: size.name.trim()
      }));

      const { error } = await supabase
        .from('shop_vehicle_sizes')
        .insert(sizesToInsert);

      if (error) throw error;

      // Notifier le parent des nouvelles données
      if (onDataUpdate) {
        onDataUpdate(sizesToInsert);
      }

      onNext();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des tailles de véhicules');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tailles de véhicules</h2>
        <p className="text-gray-600">Définissez les différentes tailles de véhicules pour adapter vos tarifs</p>
      </div>

      {/* Exemple de configuration - au-dessus du formulaire */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-3">💡 Exemple de configuration</h4>
        <ul className="space-y-2 text-sm text-gray-700 list-none">
          <li><strong>• Citadine:</strong> Petites voitures urbaines (Clio, 208, Polo, etc.)</li>
          <li><strong>• Berline:</strong> Voitures de taille moyenne (Mégane, 308, Golf, etc.)</li>
          <li><strong>• Break/SUV:</strong> Breaks et SUV compacts (Scenic, 3008, Tiguan, etc.)</li>
          <li><strong>• 4x4/Minivan:</strong> Gros véhicules (Espace, X5, Sharan, etc.)</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          Ces 4 catégories couvrent la plupart des véhicules et permettent une tarification adaptée.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
        <div className="mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="8" width="18" height="8" rx="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" />
                <circle cx="7" cy="18" r="2" strokeWidth={2} />
                <circle cx="17" cy="18" r="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Vos tailles de véhicules</h3>
          </div>
        </div>
        <p className="text-gray-600 mb-6">Définissez les différentes tailles pour adapter vos tarifs selon le type de véhicule</p>

        <div className="space-y-4">
          {vehicleSizes.map((size, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nom de la taille
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Citadine"
                      value={size.name}
                      onChange={(e) => updateVehicleSize(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="ex: Petites voitures urbaines - Clio, 208, Polo..."
                      value={size.description}
                      onChange={(e) => updateVehicleSize(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {vehicleSizes.length > 1 && (
                  <button
                    onClick={() => removeVehicleSize(index)}
                    className="text-red-500 hover:text-red-700 p-2 flex items-center justify-center mt-6"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Bouton d'ajout à l'intérieur de la liste */}
          <button
            onClick={addVehicleSize}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter une taille de véhicule
          </button>
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
          disabled={isSaving || vehicleSizes.filter(size => size.name.trim()).length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {isSaving ? 'Sauvegarde...' : 'Continuer →'}
        </button>
      </div>
    </div>
  );
};

export default VehicleSizesStep;
