import React, { useState } from 'react';
import api from '../../../../api/axios';
import './Styles/CreateCampaign.css';

export const CreateCampaign = () => {
  const [businessId, setBusinessId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaignLink, setCampaignLink] = useState('');
  const [businessName, setBusinessName] = useState('');

  // New form fields
  const [campaignName, setCampaignName] = useState('');
  const [gender, setGender] = useState('both');
  const [locations, setLocations] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleCheckAndGenerate = async () => {
    if (!businessId.trim()) {
      setError("Please enter a Business ID.");
      return;
    }

    setLoading(true);
    setError('');
    setCampaignLink('');
    setBusinessName('');
    setIsSaved(false); // Reset on new generate
    setCampaignName('');
    setGender('both');
    setLocations('');

    try {
      const res = await api.post('/admin/businesses/check', {
        business_id: businessId.trim()
      });

      const data = res.data;

      if (data.status) {
        setBusinessName(data.data.name);
        // Add random padding to make it longer, then base64 encode it
        const randomString = Math.random().toString(36).substring(2, 15);
        const encodedToken = btoa(`${businessId.trim()}||${randomString}`);
        // For local development, assume the public chat route will be /chat
        const generatedLink = `${window.location.origin}/chat/${encodedToken}`;
        setCampaignLink(generatedLink);
      } else {
        setError(data.message || 'Business not found.');
      }
    } catch (err) {
      setError("An error occurred while checking the business.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!campaignName.trim()) {
      alert("Please enter a campaign name.");
      return;
    }
    if (!locations.trim()) {
      alert("Please enter target locations.");
      return;
    }
    
    try {
      const res = await api.post('/admin/campaigns', {
        business_id: businessId.trim(),
        campaign_name: campaignName.trim(),
        gender: gender,
        locations: locations.trim(),
        campaign_link: campaignLink
      });

      if (res.data.status) {
        setIsSaved(true);
        alert("Campaign details saved! You can now open the link.");
      } else {
        alert(res.data.message || "Failed to save campaign.");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || "Something went wrong while saving the campaign.");
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (!isSaved) {
      e.preventDefault();
      alert("Please enter and submit the campaign information first!");
    }
  };

  const handleOpenChat = () => {
    if (!isSaved) {
      alert("Please enter and submit the campaign information first!");
      return;
    }
    window.open(campaignLink, '_blank');
  };

  const handleCopyLink = () => {
    if (!isSaved) {
      alert("Please enter and submit the campaign information first!");
      return;
    }
    navigator.clipboard.writeText(campaignLink);
    alert("Link copied!");
  };

  return (
    <div className="create-campaign-container">
      <div className="campaign-header">
        <h2>Create Chat Campaign</h2>
        <p>Generate a unique chat link for your clients to start a conversation.</p>
      </div>

      <div className="campaign-body">
        <div className="input-group">
          <input
            type="text"
            placeholder="e.g. BUS-CAYSSPVW"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          />
          <button onClick={handleCheckAndGenerate} disabled={loading}>
            {loading ? 'Checking...' : 'Generate Link'}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        {campaignLink && (
          <div className="result-container">
            <p className="success-text">Business Found: {businessName}</p>

            <div className="campaign-form-section">
              <h3>Campaign Details</h3>

              <div className="form-group">
                <label>Campaign Name <span style={{ color: '#d9534f' }}>*</span></label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Solar 2026 april leads"
                  disabled={isSaved}
                />
              </div>

              <div className="form-group">
                <label>Target Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} disabled={isSaved}>
                  <option value="both">Both (Male &amp; Female)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Locations (e.g. Jorhat, All Assam)</label>
                <textarea
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  placeholder="Enter locations separated by commas..."
                  disabled={isSaved}
                  rows={3}
                />
              </div>

              <button 
                className={`save-campaign-btn ${isSaved ? 'btn-disabled' : ''}`} 
                onClick={handleSaveCampaign}
                disabled={isSaved}
              >
                {isSaved ? "Campaign Saved" : "Save Campaign Details"}
              </button>
            </div>

            <div className={`link-box ${!isSaved ? 'disabled-link-box' : ''}`}>
              <a href={campaignLink} target="_blank" rel="noreferrer" onClick={handleLinkClick}>
                {campaignLink}
              </a>
              <button onClick={handleOpenChat} className={!isSaved ? "btn-disabled" : ""}>Open Chat</button>
              <button onClick={handleCopyLink} className={!isSaved ? "btn-disabled" : ""}>Copy</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
