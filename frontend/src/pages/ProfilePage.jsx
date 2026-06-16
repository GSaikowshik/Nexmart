import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Phone, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/profile');
      return;
    }

    async function loadProfile() {
      try {
        const data = await api.get('/users/me');
        setProfile({
          fullName: data.full_name || '',
          phone: data.phone_number || '',
          address: data.shipping_address?.addressLine1 || '',
          city: data.shipping_address?.city || '',
          postalCode: data.shipping_address?.postalCode || '',
        });
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await api.put('/users/me', {
        full_name: profile.fullName,
        phone_number: profile.phone,
        shipping_address: {
          addressLine1: profile.address,
          city: profile.city,
          postalCode: profile.postalCode,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="checkout-section-box">
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={28} /> Edit Profile
        </h1>

        {success && (
          <div className="flex align-center gap-sm success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '0.95rem', color: '#10b981' }}>
            <CheckCircle2 size={18} />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label className="input-label">Email Address (Read-only)</label>
            <div className="input-control" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input-control"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Phone Number</label>
            <input
              type="tel"
              className="input-control"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Default Shipping Address</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Street Address</label>
                <input
                  type="text"
                  className="input-control"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">City</label>
                  <input
                    type="text"
                    className="input-control"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Postal Code</label>
                  <input
                    type="text"
                    className="input-control"
                    value={profile.postalCode}
                    onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={saving}>
            {saving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
