import React, { useState } from 'react';
import api from '../../../../api/axios';
import './Styles/ViewCampaign.css';

interface Campaign {
  id: number;
  business_id: string;
  campaign_name: string;
  gender: string;
  locations: string;
  campaign_link: string;
  created_at: string;
}

export const ViewCampaign = () => {
  const [businessId, setBusinessId] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit Modal State
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const fetchCampaigns = async () => {
    if (!businessId.trim()) {
      alert("Please enter a Business ID.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/admin/campaigns?business_id=${businessId.trim()}`);
      if (res.data.status) {
        setCampaigns(res.data.data);
      } else {
        alert(res.data.message || 'Failed to fetch campaigns');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Error fetching campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalytics = (id: number) => {
    alert(`Analytics view for campaign ${id} coming soon!`);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const res = await api.delete(`/admin/campaigns/${id}`);
      if (res.data.status) {
        setCampaigns(campaigns.filter(c => c.id !== id));
        alert("Campaign deleted successfully");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Error deleting campaign');
    }
  };

  const handleUpdate = async () => {
    if (!editingCampaign) return;

    if (!editingCampaign.campaign_name.trim() || !editingCampaign.locations.trim()) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const res = await api.put(`/admin/campaigns/${editingCampaign.id}`, {
        campaign_name: editingCampaign.campaign_name,
        gender: editingCampaign.gender,
        locations: editingCampaign.locations
      });

      if (res.data.status) {
        setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? res.data.data : c));
        setEditingCampaign(null);
        alert("Campaign updated successfully");
      } else {
        alert(res.data.message || "Failed to update");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'Error updating campaign');
    }
  };

  return (
    <div className="view-campaign-container">
      <div className="campaign-header">
        <h2>View Campaigns</h2>
        <p>Enter a Business ID to view and manage existing campaigns.</p>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="e.g. BUS-CAYSSPVW"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
        />
        <button onClick={fetchCampaigns} disabled={loading}>
          {loading ? 'Searching...' : 'Search Campaigns'}
        </button>
      </div>

      {campaigns.length > 0 ? (
        <div className="table-responsive">
          <table className="campaign-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Campaign Name</th>
                <th>Target Gender</th>
                <th>Target Locations</th>
                <th>Link</th>
                <th>Created At</th>
                <th>Action</th>

              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => (
                <tr key={campaign.id}>
                  <td>{campaign.id}</td>
                  <td>{campaign.campaign_name}</td>
                  <td><span style={{ textTransform: 'capitalize' }}>{campaign.gender}</span></td>
                  <td>{campaign.locations}</td>
                  <td>
                    <a href={campaign.campaign_link} target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>
                      Open Link
                    </a>
                  </td>
                  <td>{new Date(campaign.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-analytics" onClick={() => handleAnalytics(campaign.id)}>View Analytics</button>
                      <button className="btn-edit" onClick={() => setEditingCampaign(campaign)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(campaign.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && businessId && <p style={{ color: '#666', marginTop: '20px' }}>No campaigns found for this business ID.</p>
      )}

      {/* Edit Modal */}
      {editingCampaign && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <h3>Edit Campaign</h3>

            <div className="edit-form-group">
              <label>Campaign Name</label>
              <input
                type="text"
                value={editingCampaign.campaign_name}
                onChange={(e) => setEditingCampaign({ ...editingCampaign, campaign_name: e.target.value })}
              />
            </div>

            <div className="edit-form-group">
              <label>Target Gender</label>
              <select
                value={editingCampaign.gender}
                onChange={(e) => setEditingCampaign({ ...editingCampaign, gender: e.target.value })}
              >
                <option value="both">Both</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="edit-form-group">
              <label>Target Locations</label>
              <textarea
                value={editingCampaign.locations}
                onChange={(e) => setEditingCampaign({ ...editingCampaign, locations: e.target.value })}
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingCampaign(null)}>Cancel</button>
              <button className="btn-save" onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
