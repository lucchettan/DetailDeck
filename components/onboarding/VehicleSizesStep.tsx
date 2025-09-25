import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface VehicleSize {
  id?: string;
  name: string;
  description: string;
}

interface VehicleSizesStepProps {
  onBack: () => void;
  onNext: () => void;
}

const VehicleSizesStep: React.FC<VehicleSizesStepProps> = ({ onBack, onNext }) => {
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

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Vos tailles de véhicules</h3>
          <button
            onClick={addVehicleSize}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <PlusIcon className="w-4 h-4" />
            Ajouter une taille
          </button>
        </div>

        <div className="space-y-4">
          {vehicleSizes.map((size, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="text-red-500 hover:text-red-700 p-1 mt-1"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">💡 Configuration recommandée</h4>
          <div className="space-y-2 text-sm text-green-700">
            <div><strong>Citadine:</strong> Petites voitures urbaines (Clio, 208, Polo, etc.)</div>
            <div><strong>Berline:</strong> Voitures de taille moyenne (Mégane, 308, Golf, etc.)</div>
            <div><strong>Break/SUV:</strong> Breaks et SUV compacts (Scenic, 3008, Tiguan, etc.)</div>
            <div><strong>4x4/Minivan:</strong> Gros véhicules (Espace, X5, Sharan, etc.)</div>
          </div>
          <p className="text-xs text-green-600 mt-2">
            Ces 4 catégories couvrent la plupart des véhicules et permettent une tarification adaptée.
          </p>
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
