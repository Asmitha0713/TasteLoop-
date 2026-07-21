import { useState } from 'react'
import CookNav from '../components/CookNav.jsx'
import './CookFoods.css'

const initialProfile = { name: 'Nadeesha Perera', kitchen: 'Nadeesha’s Kitchen', email: 'nadeesha@example.com', phone: '077 123 4567', location: 'Kilinochchi', specialty: 'Traditional Sri Lankan', bio: 'I make comforting Sri Lankan meals using family recipes, fresh produce and spices ground in my own kitchen.' }

export default function CookProfile() {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tasteloop-cook-profile')) || initialProfile } catch { return initialProfile }
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)
  const update = (e) => setDraft((current) => ({ ...current, [e.target.name]: e.target.value }))
  const save = (e) => {
    e.preventDefault(); setProfile(draft); setEditing(false); setSaved(true)
    try { localStorage.setItem('tasteloop-cook-profile', JSON.stringify(draft)) } catch { /* Keep the current session usable. */ }
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="page cook-page"><CookNav />
      <main className="page-content cook-main"><div className="container profile-container">
        {saved && <div className="success-banner">✓ Your profile has been updated.</div>}
        <div className="manage-heading"><div><span className="eyebrow">Your public presence</span><h1>Home cook profile</h1><p>Keep your kitchen story and contact information up to date.</p></div>{!editing && <button className="btn btn-primary" onClick={() => { setDraft(profile); setEditing(true) }}>✎ Edit Profile</button>}</div>

        <div className="profile-layout">
          <aside className="card profile-summary"><div className="profile-photo">👩🏽‍🍳<button aria-label="Change profile photo">＋</button></div><h2>{profile.name}</h2><p>{profile.kitchen}</p><span className="verified-badge">✓ Verified home cook</span><div className="profile-rating"><div><strong>4.9</strong><small>Rating</small></div><div><strong>214</strong><small>Orders</small></div><div><strong>3 yrs</strong><small>Cooking</small></div></div><div className="completion"><div><span>Profile completion</span><strong>90%</strong></div><i><b /></i><small>Add a cover photo to complete your profile.</small></div></aside>

          <section className="card profile-details">
            <div className="panel-heading"><div><h2>Personal & kitchen details</h2><p>This information helps customers get to know you.</p></div></div>
            {editing ? <form onSubmit={save} className="profile-form"><div className="form-grid">
              <label className="food-field"><span>Full name</span><input name="name" value={draft.name} onChange={update} required /></label><label className="food-field"><span>Kitchen name</span><input name="kitchen" value={draft.kitchen} onChange={update} required /></label>
              <label className="food-field"><span>Email address</span><input name="email" type="email" value={draft.email} onChange={update} required /></label><label className="food-field"><span>Phone number</span><input name="phone" value={draft.phone} onChange={update} required /></label>
              <label className="food-field"><span>Location</span><input name="location" value={draft.location} onChange={update} /></label><label className="food-field"><span>Cooking specialty</span><input name="specialty" value={draft.specialty} onChange={update} /></label>
              <label className="food-field full"><span>About your kitchen</span><textarea name="bio" rows="5" value={draft.bio} onChange={update} /></label>
            </div><div className="form-actions profile-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary">Save Changes</button></div></form> : <div className="profile-info">
              <div><span>Full name</span><strong>{profile.name}</strong></div><div><span>Kitchen name</span><strong>{profile.kitchen}</strong></div><div><span>Email address</span><strong>{profile.email}</strong></div><div><span>Phone number</span><strong>{profile.phone}</strong></div><div><span>Location</span><strong>⌖ {profile.location}</strong></div><div><span>Specialty</span><strong>{profile.specialty}</strong></div><div className="wide"><span>About your kitchen</span><p>{profile.bio}</p></div>
            </div>}
          </section>
        </div>
      </div></main>
    </div>
  )
}
