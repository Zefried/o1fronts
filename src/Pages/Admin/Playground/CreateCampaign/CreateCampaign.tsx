import React, { useState } from 'react';
import './Styles/CreateCampaign.css';

export const CreateCampaign = () => {
  const [businessId, setBusinessId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaignLink, setCampaignLink] = useState('');
  const [businessName, setBusinessName] = useState('');

  const handleCheckAndGenerate = async () => {
    if (!businessId.trim()) {
      setError("Please enter a Business ID.");
      return;
    }

    setLoading(true);
    setError('');
    setCampaignLink('');
    setBusinessName('');

    try {
      const token = localStorage.getItem('token');
      // Using full URL for local dev, ensure the port matches your backend.
      const res = await fetch(`http://localhost:8000/api/admin/businesses/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ business_id: businessId.trim() })
      });

      const data = await res.json();

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
            <div className="link-box">
              <a href={campaignLink} target="_blank" rel="noreferrer">{campaignLink}</a>
              <button onClick={() => window.open(campaignLink, '_blank')}>Open Chat</button>
              <button onClick={() => navigator.clipboard.writeText(campaignLink)}>Copy</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
