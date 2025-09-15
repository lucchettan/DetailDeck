
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Shop } from '../Dashboard';
import { VITE_STRIPE_CLIENT_ID } from '../../lib/env';

interface AccountProps {
    shopData: Shop | null;
    onDisconnectStripe: () => void;
}

const Account: React.FC<AccountProps> = ({ shopData, onDisconnectStripe }) => {
    const { t } = useLanguage();
    const { updateUserPassword } = useAuth();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const [isConnectingStripe, setIsConnectingStripe] = useState(false);
    
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
    
    const handleStripeConnect = () => {
        setIsConnectingStripe(true);
        if (!VITE_STRIPE_CLIENT_ID) {
            alert('Stripe connection is not configured correctly. Please contact support.');
            setIsConnectingStripe(false);
            return;
        }
        const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${VITE_STRIPE_CLIENT_ID}&scope=read_write`;
        window.location.href = stripeConnectUrl;
    };

    const isStripeConnected = shopData?.stripeAccountEnabled;

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

            <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-brand-dark mb-1 border-b pb-4">{t.payments}</h3>
                <p className="text-brand-gray text-sm mt-4 mb-6">{t.paymentsSubtitle}</p>
                {isStripeConnected ? (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                        <p className="font-semibold text-green-800">{t.stripeConnected}</p>
                        <p className="text-sm text-green-700 mt-2">
                           {t.connectedAs} <span className="font-mono bg-green-100 p-1 rounded text-xs">{shopData.stripeAccountId}</span>
                        </p>
                        <div className="mt-4">
                            <a href={`https://dashboard.stripe.com/accounts/${shopData.stripeAccountId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-blue hover:underline font-semibold">
                                {t.manageStripeAccount} &rarr;
                            </a>
                            <button onClick={onDisconnectStripe} className="ml-4 text-sm text-red-600 hover:underline font-semibold">
                                {t.disconnectStripe}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-brand-gray mb-4">{t.stripeConnectionDescription}</p>
                        <button onClick={handleStripeConnect} disabled={isConnectingStripe} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-75">
                            {isConnectingStripe ? t.redirecting : t.connectWithStripe}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Account;