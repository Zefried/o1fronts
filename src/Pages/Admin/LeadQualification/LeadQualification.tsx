import { useState } from 'react';
import { Settings, Save, Search, PlusCircle, LayoutList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import './Styles/LeadQualification.css';

interface Service {
    id: number;
    name: string;
}

export const LeadQualification = () => {
    const navigate = useNavigate();
    const [businessId, setBusinessId] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [qualifications, setQualifications] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const fetchServices = async () => {
        if (!businessId.trim()) {
            alert("Business ID is required.");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/admin/lead-qualifications/services', { business_id: businessId.trim() });
            if (res.data.status) {
                setServices(res.data.data.services);
                const qualMap = res.data.data.qualifications;
                setQualifications(qualMap || {});
                setSelectedServiceIds(Object.keys(qualMap || {}).map(Number));
            } else {
                alert(res.data.message || 'Failed to fetch services');
                setServices([]);
                setSelectedServiceIds([]);
                setQualifications({});
            }
        } catch (error) {
            console.error(error);
            alert('Failed to fetch services.');
        } finally {
            setLoading(false);
        }
    };

    const toggleService = (id: number) => {
        setSelectedServiceIds(prev => 
            prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
        );
    };

    const handleQuestionChange = (serviceId: number, value: string) => {
        setQualifications(prev => ({
            ...prev,
            [serviceId]: value
        }));
    };

    const handleSave = async () => {
        const payload = selectedServiceIds.map(id => ({
            service_id: id,
            questions: qualifications[id] || ''
        }));
        
        setSaving(true);
        try {
            const res = await api.post('/admin/lead-qualifications/save', {
                business_id: businessId.trim(),
                qualifications: payload
            });
            if (res.data.status) {
                alert('Successfully saved');
            } else {
                alert(res.data.message || 'Failed to save');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save qualifications.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="lq-config">
            {/* Header */}
            <div className="lq-config__header">
                <div className="lq-config__header-inner" style={{ justifyContent: 'space-between', display: 'flex' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings className="lq-config__header-icon" />
                        <div>
                            <h1 className="lq-config__title">Lead Qualification Config</h1>
                            <p className="lq-config__subtitle">Configure the questions asked to users for different services.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/lead-qualification/view')}
                        className="lq-config__btn lq-config__btn--outline lq-config__btn--with-icon"
                    >
                        <LayoutList className="lq-config__btn-icon" />
                        View Saved Qualifications
                    </button>
                </div>
            </div>

            {/* 1. Select Business */}
            <div className="lq-config__card">
                <h2 className="lq-config__card-title">1. Select Business</h2>
                <div className="lq-config__group-row">
                    <input 
                        type="text" 
                        value={businessId}
                        onChange={(e) => {
                            setBusinessId(e.target.value);
                        }}
                        placeholder="Enter Business ID (e.g. BUS-123)"
                        className="lq-config__input lq-config__input--flex"
                    />
                    <button 
                        onClick={fetchServices}
                        disabled={loading}
                        className="lq-config__btn lq-config__btn--primary lq-config__btn--with-icon"
                    >
                        <Search className="lq-config__btn-icon" />
                        {loading ? "Fetching..." : "Fetch Services"}
                    </button>
                </div>
            </div>

            {/* 2. Select Services */}
            {services.length > 0 && (
                <div className="lq-config__card">
                    <h2 className="lq-config__card-title">2. Select Services</h2>
                    <div className="lq-config__checkbox-grid">
                        {services.map(service => (
                            <label 
                                key={service.id} 
                                className={`lq-config__checkbox-label ${selectedServiceIds.includes(service.id) ? 'lq-config__checkbox-label--active' : ''}`}
                            >
                                <input 
                                    type="checkbox" 
                                    className="lq-config__checkbox"
                                    checked={selectedServiceIds.includes(service.id)}
                                    onChange={() => toggleService(service.id)}
                                />
                                <span className="lq-config__checkbox-text">{service.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Configure Questions */}
            {selectedServiceIds.length > 0 && (
                <div className="lq-config__card">
                    <h2 className="lq-config__card-title">3. Configure Questions</h2>
                    <div className="lq-config__service-list">
                        {selectedServiceIds.map(id => {
                            const service = services.find(s => s.id === id);
                            return (
                                <div key={id} className="lq-config__service-box">
                                    <h3 className="lq-config__service-title">
                                        <PlusCircle className="lq-config__service-icon" />
                                        {service?.name}
                                    </h3>
                                    <p className="lq-config__service-hint">Enter the questions to ask for this service (e.g. BHK, possession status, budget)</p>
                                    <textarea 
                                        rows={2}
                                        value={qualifications[id] || ''}
                                        onChange={(e) => handleQuestionChange(id, e.target.value)}
                                        placeholder="e.g. Property type, BHK/size, scope, location, budget, timeline..."
                                        className="lq-config__textarea"
                                    />
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="lq-config__actions">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="lq-config__btn lq-config__btn--success lq-config__btn--with-icon"
                        >
                            <Save className="lq-config__btn-icon" />
                            {saving ? "Saving..." : "Save Configuration"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
