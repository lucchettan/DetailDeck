
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon, MoneyIcon, HourglassIcon, TrashIcon, SaveIcon } from '../Icons';
import { AddOn } from '../Dashboard';
import CustomSelect from '../CustomSelect';

interface AddOnEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addOn: Omit<AddOn, 'id' | 'shopId'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  addOnToEdit: AddOn | null;
}

const getInitialFormData = (addOn: AddOn | null): Omit<AddOn, 'id' | 'shopId'> & { id?: string } => {
  if (addOn) return { ...addOn };
  return {
    name: '',
    price: '10',
    duration: '15',
  };
};

const DurationPicker: React.FC<{ value: string, onChange: (value: string) => void }> = ({ value, onChange }) => {
    const options = useMemo(() => {
        const opts = [];
        for (let minutes = 0; minutes <= 180; minutes += 15) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            let label = '';
            if (h > 0) label += `${h}h`;
            if (m > 0) {
                if (h > 0) label += ' ';
                label += `${m}min`;
            }
            opts.push({ value: minutes.toString(), label: label || '0min' });
        }
        return opts;
    }, []);

    return (
        <CustomSelect
            value={value}
            onChange={onChange}
            options={options}
            icon={<HourglassIcon className="h-5 w-5" />}
        />
    );
}

const AddOnEditor: React.FC<AddOnEditorProps> = ({ isOpen, onClose, onSave, onDelete, addOnToEdit }) => {
  const { t } = useLanguage();
  const isEditing = !!addOnToEdit;

  const [formData, setFormData] = useState(getInitialFormData(addOnToEdit));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(getInitialFormData(addOnToEdit));
  }, [addOnToEdit, isOpen]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  const handleDelete = () => {
    if (isEditing && window.confirm(t.deleteAddOnConfirmation)) {
      onDelete(addOnToEdit.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-brand-dark">
            {isEditing ? t.editAddOn : t.addNewAddOn}
          </h2>
          <button onClick={onClose}><CloseIcon /></button>
        </header>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-brand-dark mb-1">{t.addOnName}</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-bold text-brand-dark mb-1">{t.price}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MoneyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-brand-dark mb-1">{t.duration}</label>
              <DurationPicker 
                value={formData.duration}
                onChange={(value) => setFormData(p => ({ ...p, duration: value }))}
              />
            </div>
          </div>
        </form>

        <footer className="flex justify-between items-center p-4 border-t mt-auto">
          <div>
            {isEditing && (
              <button onClick={handleDelete} className="text-red-600 font-semibold hover:underline flex items-center gap-2">
                <TrashIcon className="w-5 h-5"/> {t.deleteAddOn}
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="bg-gray-200 text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-gray-300">{t.cancel}</button>
            <button onClick={handleSubmit} disabled={isSaving} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-75">
                <SaveIcon className="w-5 h-5" />
                {isSaving ? '...' : (isEditing ? t.saveChanges : t.createAddOn)}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AddOnEditor;