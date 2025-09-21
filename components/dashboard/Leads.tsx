import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Lead } from '../Dashboard';
import { supabase } from '../../lib/supabaseClient';
import { toCamelCase } from '../../lib/utils';

interface LeadsProps {
  shopId: string;
  initialLeads?: Lead[];
}

const getStatusBadgeStyle = (status: Lead['status']) => {
  switch (status) {
    case 'converted': return 'bg-green-100 text-green-800';
    case 'lost': return 'bg-red-100 text-red-800';
    case 'contacted': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-blue-100 text-blue-800'; // to_call
  }
};

const Leads: React.FC<LeadsProps> = ({ shopId, initialLeads }) => {
  const { t } = useLanguage();
  const [leads, setLeads] = useState<Lead[]>(initialLeads || []);
  const [loading, setLoading] = useState(!initialLeads);

  const fetchLeads = useCallback(async () => {
    if (initialLeads) return;
    if (!shopId) return;
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
    }
    setLoading(false);
  }, [shopId, initialLeads]);

  useEffect(() => {
    fetchLeads();
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-dark">{t.hotLeads}</h2>
        <p className="text-brand-gray mt-1">{t.hotLeadsSubtitle}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                        {lead.selectedServices.services.map(s => s.serviceName).join(', ')}
                      </div>
                      <div className="text-xs text-brand-gray">
                        {t.forVehicle.replace('{vehicleSize}', t[`size_${lead.selectedServices.vehicleSize as 'S'|'M'|'L'|'XL'}`])}
                      </div>
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