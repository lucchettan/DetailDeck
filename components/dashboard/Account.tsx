

import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const Account: React.FC = () => {
    const { t } = useLanguage();
    const { updateUserPassword } = useAuth();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (password.length < 6) {
            setPasswordError(t.passwordTooShort);
            return;
        }
        if (password !== confirmPassword) {
            setPasswordError(t.passwordMismatch);
            return;
        }

        setIsUpdatingPassword(true);
        const { error } = await updateUserPassword(password);
        if (error) {
            setPasswordError(error.message);
            alert(`Error updating password: ${error.message}`);
        } else {
            setPasswordSuccess(t.passwordUpdatedSuccess);
            setPassword('');
            setConfirmPassword('');
        }
        setIsUpdatingPassword(false);
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.account}</h2>
            <p className="text-brand-gray mb-6">{t.accountManagement}</p>
            
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-bold text-brand-dark mb-1 border-b pb-4">{t.passwordManagement}</h3>
                <p className="text-brand-gray text-sm mt-4 mb-6">{t.passwordManagementSubtitle}</p>
                <form onSubmit={handlePasswordUpdate} className="max-w-md space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-brand-dark mb-1">{t.newPassword}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-brand-dark mb-1">{t.confirmNewPassword}</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                    {passwordSuccess && <p className="text-green-600 text-sm">{passwordSuccess}</p>}
                    <div>
                        <button type="submit" disabled={isUpdatingPassword} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-75">
                            {isUpdatingPassword ? '...' : t.updatePassword}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Account;