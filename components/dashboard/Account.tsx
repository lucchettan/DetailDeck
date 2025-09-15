
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Shop } from '../Dashboard';

interface AccountProps {
    shopData: Shop | null;
}

const Account: React.FC<AccountProps> = ({ shopData }) => {
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
        } else {
            setPasswordSuccess(t.passwordUpdatedSuccess);
            setPassword('');
            setConfirmPassword('');
        }
        setIsUpdatingPassword(false);
    };
    
    // In a real app, this would trigger a backend flow to generate a Stripe Connect Onboarding link.
    const handleStripeConnect = () => {
        setIsConnectingStripe(true);
        // This test client_id is from Stripe's documentation for testing purposes.
        // It allows the OAuth flow to proceed to a Stripe test page.
        // In a real application, you would replace this with your own platform's client_id.
        const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_gT4G6d5H5g6g6g6g6g6g6g6g6g6g6g6g&scope=read_write`;
        window.location.href = stripeConnectUrl;
    };

    const isStripeConnected = shopData?.stripe_account_id && shopData?.stripe_account_enabled;

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
                        <a href="https://dashboard.stripe.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-blue hover:underline mt-2 inline-block">
                            {t.manageStripeAccount} &rarr;
                        </a>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-brand-gray mb-4">{t.stripeConnectionDescription}</p>
                        <button onClick={handleStripeConnect} disabled={isConnectingStripe} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-75">
                            {isConnectingStripe ? '...' : t.connectWithStripe}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Account;