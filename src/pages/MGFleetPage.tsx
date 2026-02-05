import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Search, TrendingUp, TrendingDown, 
  Calendar, FileText, DollarSign, MapPin,
  ChevronRight, AlertCircle
} from 'lucide-react';

interface MGContract {
  id: string;
  fleet_name: string;
  contract_start_date: string;
  contract_end_date: string;
  assured_km_per_year: number;
  rate_per_km: number;
  excess_rate_per_km?: number;
  billing_cycle_months: number;
  is_active: boolean;
}

interface VehicleLog {
  id: string;
  vehicle_reg_number: string;
  billing_month: string;
  opening_odometer: number;
  closing_odometer: number;
  actual_km_run: number;
  assured_km_quota: number;
  billable_amount: number;
  status: 'PENDING' | 'CALCULATED' | 'INVOICED' | 'DISPUTED';
}

interface MGReport {
  contract: MGContract;
  summary: {
    total_vehicles: number;
    total_km_run: number;
    total_billed_amount: number;
    log_entries: number;
  };
  vehicle_logs: VehicleLog[];
}

export default function MGFleetPage() {
  const [contracts, setContracts] = useState<MGContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<MGContract | null>(null);
  const [contractReport, setContractReport] = useState<MGReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // New contract form
  const [newContract, setNewContract] = useState({
    fleet_name: '',
    contract_start_date: '',
    contract_end_date: '',
    assured_km_per_year: 12000,
    rate_per_km: 10.5,
    excess_rate_per_km: 15.0,
    billing_cycle_months: 1
  });

  // New log form
  const [newLog, setNewLog] = useState({
    contract_id: '',
    vehicle_reg_number: '',
    billing_month: '',
    opening_odometer: 0,
    closing_odometer: 0,
    notes: ''
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mg/contracts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching MG contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractReport = async (contractId: string) => {
    try {
      const response = await fetch(`/api/mg/reports/${contractId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContractReport(data);
      }
    } catch (error) {
      console.error('Error fetching MG report:', error);
    }
  };

  const handleCreateContract = async () => {
    try {
      const response = await fetch('/api/mg/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newContract)
      });

      if (response.ok) {
        setShowNewModal(false);
        setNewContract({
          fleet_name: '',
          contract_start_date: '',
          contract_end_date: '',
          assured_km_per_year: 12000,
          rate_per_km: 10.5,
          excess_rate_per_km: 15.0,
          billing_cycle_months: 1
        });
        fetchContracts();
      }
    } catch (error) {
      console.error('Error creating contract:', error);
    }
  };

  const handleCreateLog = async () => {
    try {
      const response = await fetch('/api/mg/vehicle-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newLog,
          contract_id: selectedContract?.id
        })
      });

      if (response.ok) {
        setShowLogModal(false);
        setNewLog({
          contract_id: '',
          vehicle_reg_number: '',
          billing_month: '',
          opening_odometer: 0,
          closing_odometer: 0,
          notes: ''
        });
        if (selectedContract) {
          fetchContractReport(selectedContract.id);
        }
      }
    } catch (error) {
      console.error('Error creating vehicle log:', error);
    }
  };

  const selectContract = (contract: MGContract) => {
    setSelectedContract(contract);
    fetchContractReport(contract.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MG Fleet Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Minimum Guarantee contracts and fleet billing
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#f18a22] text-white rounded-lg hover:bg-[#e07d1a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Contract
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contracts List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Contracts</h2>
            </div>
            
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : contracts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Truck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No contracts found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {contracts.map((contract) => (
                  <button
                    key={contract.id}
                    onClick={() => selectContract(contract)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedContract?.id === contract.id ? 'bg-orange-50 border-l-4 border-[#f18a22]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{contract.fleet_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        contract.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {contract.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>₹{contract.rate_per_km}/km</p>
                      <p>{formatNumber(contract.assured_km_per_year)} km/year assured</p>
                      <p className="text-xs">
                        {new Date(contract.contract_start_date).toLocaleDateString()} - {new Date(contract.contract_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contract Details */}
        <div className="lg:col-span-2">
          {selectedContract ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              {contractReport?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">Total Vehicles</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {contractReport.summary.total_vehicles}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">Total KM Run</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatNumber(contractReport.summary.total_km_run)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">Total Billed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(contractReport.summary.total_billed_amount)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">Log Entries</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {contractReport.summary.log_entries}
                    </p>
                  </div>
                </div>
              )}

              {/* Contract Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Contract Details</h2>
                  <button
                    onClick={() => setShowLogModal(true)}
                    className="px-3 py-1.5 bg-[#f18a22] text-white text-sm rounded-lg hover:bg-[#e07d1a]"
                  >
                    Add Vehicle Log
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Assured KM/Year</p>
                    <p className="font-medium text-gray-900">
                      {formatNumber(selectedContract.assured_km_per_year)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rate per KM</p>
                    <p className="font-medium text-gray-900">
                      ₹{selectedContract.rate_per_km}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Excess Rate</p>
                    <p className="font-medium text-gray-900">
                      ₹{selectedContract.excess_rate_per_km || selectedContract.rate_per_km}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Billing Cycle</p>
                    <p className="font-medium text-gray-900">
                      {selectedContract.billing_cycle_months} month(s)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedContract.contract_start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedContract.contract_end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Logs */}
              {contractReport?.vehicle_logs && contractReport.vehicle_logs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Recent Vehicle Logs</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Vehicle</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Month</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">KM Run</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Billable</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {contractReport.vehicle_logs.slice(0, 10).map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-3 font-medium">{log.vehicle_reg_number}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(log.billing_month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatNumber(log.actual_km_run)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {log.billable_amount ? formatCurrency(log.billable_amount) : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                log.status === 'INVOICED' ? 'bg-green-100 text-green-700' :
                                log.status === 'CALCULATED' ? 'bg-blue-100 text-blue-700' :
                                log.status === 'DISPUTED' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Contract</h3>
              <p className="text-gray-500">Choose a contract from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* New Contract Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">New MG Contract</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fleet Name *
                </label>
                <input
                  type="text"
                  value={newContract.fleet_name}
                  onChange={(e) => setNewContract({...newContract, fleet_name: e.target.value})}
                  placeholder="e.g., ABC Logistics Fleet"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newContract.contract_start_date}
                    onChange={(e) => setNewContract({...newContract, contract_start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newContract.contract_end_date}
                    onChange={(e) => setNewContract({...newContract, contract_end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assured KM per Year *
                </label>
                <input
                  type="number"
                  value={newContract.assured_km_per_year}
                  onChange={(e) => setNewContract({...newContract, assured_km_per_year: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate per KM (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newContract.rate_per_km}
                    onChange={(e) => setNewContract({...newContract, rate_per_km: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excess Rate per KM (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newContract.excess_rate_per_km}
                    onChange={(e) => setNewContract({...newContract, excess_rate_per_km: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Cycle (months)
                </label>
                <select
                  value={newContract.billing_cycle_months}
                  onChange={(e) => setNewContract({...newContract, billing_cycle_months: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                >
                  <option value={1}>Monthly</option>
                  <option value={3}>Quarterly</option>
                  <option value={6}>Half Yearly</option>
                  <option value={12}>Yearly</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateContract}
                disabled={!newContract.fleet_name || !newContract.contract_start_date}
                className="px-4 py-2 bg-[#f18a22] text-white rounded-lg hover:bg-[#e07d1a] disabled:opacity-50"
              >
                Create Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Log Modal */}
      {showLogModal && selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Vehicle Log</h2>
              <p className="text-sm text-gray-500">{selectedContract.fleet_name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Registration *
                </label>
                <input
                  type="text"
                  value={newLog.vehicle_reg_number}
                  onChange={(e) => setNewLog({...newLog, vehicle_reg_number: e.target.value.toUpperCase()})}
                  placeholder="MH01AB1234"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Month *
                </label>
                <input
                  type="month"
                  value={newLog.billing_month}
                  onChange={(e) => setNewLog({...newLog, billing_month: e.target.value + '-01'})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Odometer *
                  </label>
                  <input
                    type="number"
                    value={newLog.opening_odometer}
                    onChange={(e) => setNewLog({...newLog, opening_odometer: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Closing Odometer *
                  </label>
                  <input
                    type="number"
                    value={newLog.closing_odometer}
                    onChange={(e) => setNewLog({...newLog, closing_odometer: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newLog.notes}
                  onChange={(e) => setNewLog({...newLog, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22]"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLog}
                disabled={!newLog.vehicle_reg_number || !newLog.billing_month}
                className="px-4 py-2 bg-[#f18a22] text-white rounded-lg hover:bg-[#e07d1a] disabled:opacity-50"
              >
                Add Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
