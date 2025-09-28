import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Lead } from '../Dashboard';
import { supabase } from '../../lib/supabaseClient';
import { toCamelCase } from '../../lib/utils';

interface LeadsProps {
  shopId: string;
  initialLeads?: Lead[];
  onNavigateHome?: () => void;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getStatusBadgeStyle = (status: Lead['status']) => {
  switch (status) {
    case 'converted': return 'bg-green-100 text-green-800';
    case 'lost': return 'bg-red-100 text-red-800';
    case 'contacted': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-blue-100 text-blue-800'; // to_call
  }
};

const Leads: React.FC<LeadsProps> = ({ shopId, initialLeads, onNavigateHome }) => {
  const { t } = useLanguage();
  const [leads, setLeads] = useState<Lead[]>(initialLeads || []);
  const [loading, setLoading] = useState(!initialLeads);
  const [lastFetched, setLastFetched] = useState<number | null>(initialLeads ? Date.now() : null);

  const fetchLeads = useCallback(async (force = false) => {
    if (initialLeads) return;
    if (!shopId) return;

    const now = Date.now();
    if (!force && lastFetched && (now - lastFetched < CACHE_DURATION)) {
      return; // Use cached data, do not trigger loading state.
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
    } else if (data) {
      setLeads(toCamelCase(data) as Lead[]);
      setLastFetched(Date.now());
    }
    setLoading(false);
  }, [shopId, initialLeads, lastFetched]);

  useEffect(() => {
    fetchLeads();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLeads();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchLeads]);

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    const { data, error } = await supabase
      .from('leads')
      .update(toCamelCase(updates))
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return;
    }

    if (data) {
      setLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? toCamelCase(data) as Lead : lead));
    }
  };


  const handleStatusChange = (leadId: string, newStatus: Lead['status']) => {
    handleUpdateLead(leadId, { status: newStatus });
  };

  const statusOptions: Lead['status'][] = ['to_call', 'contacted', 'converted', 'lost'];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Bouton retour à l'accueil */}
      <div className="mb-4">
        <button
          onClick={onNavigateHome || (() => window.history.back())}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à l'accueil
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-dark">{t.hotLeads}</h2>
        <p className="text-brand-gray mt-1">{t.hotLeadsSubtitle}</p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg overflow-hidden border border-blue-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-brand-dark uppercase tracking-wider">{t.status}</th>
                <th className="px-6 py-3 text-xs font-bold text-brand-dark uppercase tracking-wider">{t.clientPhone}</th>
                <th className="px-6 py-3 text-xs font-bold text-brand-dark uppercase tracking-wider">{t.requestedServices}</th>
                <th className="px-6 py-3 text-xs font-bold text-brand-dark uppercase tracking-wider">{t.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead['status'])}
                        className={`p-1.5 text-xs font-semibold rounded-md border-transparent focus:ring-2 focus:ring-brand-blue focus:border-transparent ${getStatusBadgeStyle(lead.status)}`}
                        onClick={(e) => e.stopPropagation()} // Prevent row click event
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>
                            {t[`status_${status}`]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`tel:${lead.clientPhone}`} className="font-semibold text-brand-blue hover:underline">{lead.clientPhone}</a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-brand-dark">
                        {/* Afficher le message pour les nouvelles leads, ou les services pour les anciennes */}
                        {lead.message ? (
                          <span className="text-sm">{lead.message}</span>
                        ) : lead.selectedServices?.services ? (
                          lead.selectedServices.services.map(s => s.serviceName).join(', ')
                        ) : (
                          'Aucun détail disponible'
                        )}
                      </div>
                      {/* Afficher les infos véhicule seulement pour les anciennes leads avec selectedServices */}
                      {lead.selectedServices?.vehicleSize && (
                        <div className="text-xs text-brand-gray">
                          {t.forVehicle.replace('{vehicleSize}', t[`size_${lead.selectedServices.vehicleSize as 'S' | 'M' | 'L' | 'XL'}`])}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-brand-gray">
                    {t.noLeads}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leads;
