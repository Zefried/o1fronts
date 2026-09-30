import { useState } from 'react';
import { Search, Trash2, LayoutList } from 'lucide-react';
import api from '../../../api/axios';
import './Styles/LeadQualification.css';
import { useNavigate } from 'react-router-dom';

interface Service {
    id: number;
    name: string;
}

interface SavedQualification {
    id: number;
    business_id: string;
    service_id: number;
    questions: string;
}

export const ViewLeadQualification = () => {
    const navigate = useNavigate();
    const [businessId, setBusinessId] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [savedQualificationsList, setSavedQualificationsList] = useState<SavedQualification[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    
    const fetchServices = async () => {
        if (!businessId.trim()) {
            alert("Business ID is required.");
            return;
        }
        setLoading(true);
        setHasFetched(false);
        try {
            const res = await api.post('/admin/lead-qualifications/services', { business_id: businessId.trim() });
            if (res.data.status) {
                setServices(res.data.data.services || []);
                setSavedQualificationsList(res.data.data.qualifications_list || []);
            } else {
                alert(res.data.message || 'Failed to fetch qualifications');
                setServices([]);
                setSavedQualificationsList([]);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to fetch qualifications.');
        } finally {
            setLoading(false);
            setHasFetched(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this qualification?')) return;
        try {
            const res = await api.delete(`/admin/lead-qualifications/${id}`);
            if (res.data.status) {
                alert('Deleted successfully');
                fetchServices();
            } else {
                alert(res.data.message || 'Failed to delete');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete qualification.');
        }
    };

    return (
        <div className="lq-config">
            {/* Header */}
            <div className="lq-config__header">
                <div className="lq-config__header-inner" style={{ justifyContent: 'space-between', display: 'flex' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LayoutList className="lq-config__header-icon" />
                        <div>
                            <h1 className="lq-config__title">View Lead Qualifications</h1>
                            <p className="lq-config__subtitle">View and manage existing questions for a business.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/lead-qualification')}
                        className="lq-config__btn lq-config__btn--outline"
                    >
                        Add / Edit Qualifications
                    </button>
                </div>
            </div>

            {/* Select Business */}
            <div className="lq-config__card">
                <h2 className="lq-config__card-title">Select Business</h2>
                <div className="lq-config__group-row">
                    <input 
                        type="text" 
                        value={businessId}
                        onChange={(e) => setBusinessId(e.target.value)}
                        placeholder="Enter Business ID (e.g. BUS-123)"
                        className="lq-config__input lq-config__input--flex"
                    />
                    <button 
                        onClick={fetchServices}
                        disabled={loading}
                        className="lq-config__btn lq-config__btn--primary lq-config__btn--with-icon"
                    >
                        <Search className="lq-config__btn-icon" />
                        {loading ? "Fetching..." : "Fetch Qualifications"}
                    </button>
                </div>
            </div>

            {/* View Saved Qualifications */}
            {hasFetched && (
                <div className="lq-config__card">
                    <h2 className="lq-config__card-title">Saved Qualifications</h2>
                    {savedQualificationsList.length > 0 ? (
                        <div className="lq-config__table-wrapper">
                            <table className="lq-config__table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Business ID</th>
                                        <th>Service Name</th>
                                        <th>Questions</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {savedQualificationsList.map(qual => {
                                        const serviceName = services.find(s => s.id === qual.service_id)?.name || `Service ID: ${qual.service_id}`;
                                        return (
                                            <tr key={qual.id}>
                                                <td>{qual.id}</td>
                                                <td>{qual.business_id}</td>
                                                <td>{serviceName}</td>
                                                <td className="lq-config__table-questions">{qual.questions}</td>
                                                <td>
                                                    <button 
                                                        className="lq-config__action-btn lq-config__action-btn--delete"
                                                        onClick={() => handleDelete(qual.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>No saved qualifications found for this business.</p>
                    )}
                </div>
            )}
        </div>
    );
};
