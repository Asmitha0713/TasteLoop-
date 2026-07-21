import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CookNav from '../components/CookNav.jsx'
import api, { apiError } from '../services/api.js'
import './CookFoods.css'

const emptyForm = { name: '', category: '', price: '', portions: '', description: '', ingredients: '', prepTime: '', available: true }

export default function AddFood() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [preview, setPreview] = useState('')
  useEffect(() => {
    if (!id) return
    api.get('/foods/mine/list').then(({ data }) => {
      const food = data.data.find((item) => item.id === id)
      if (food) setForm({ ...emptyForm, ...food, price: String(food.price), portions: String(food.portions), prepTime: food.prep_time || '', ingredients: (food.ingredients || []).join(', ') })
    }).catch((error) => setErrors({ form: apiError(error) }))
  }, [id])

  const update = (event) => {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const chooseImage = (event) => {
    const file = event.target.files[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Please enter a food name.'
    if (!form.category) nextErrors.category = 'Please select a category.'
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'Enter a valid price.'
    if (form.portions === '' || Number(form.portions) < 0) nextErrors.portions = 'Enter the number of portions.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const payload = { name: form.name, category: form.category, price: Number(form.price), portions: Number(form.portions), description: form.description, ingredients: form.ingredients.split(',').map((item) => item.trim()).filter(Boolean), prep_time: form.prepTime ? Number(form.prepTime) : null, available: form.available }
    try {
      if (id) await api.patch(`/foods/${id}`, payload)
      else await api.post('/foods', payload)
      navigate('/cook/foods', { state: { message: id ? 'Food updated and submitted for approval.' : 'Food submitted for approval.' } })
    } catch (error) { setErrors({ form: apiError(error) }) }
  }

  return (
    <div className="page cook-page"><CookNav />
      <main className="page-content cook-main">
        <div className="container">
          <div className="cook-breadcrumb"><Link to="/cook/foods">My Foods</Link><span>›</span><span>{id ? 'Edit Food' : 'Add New Food'}</span></div>
          <div className="cook-heading"><div><span className="eyebrow">Kitchen menu</span><h1>{id ? 'Edit your food' : 'Add a new food'}</h1><p>Share a little about the meal and how many portions are ready.</p></div></div>
          <form className="food-form" onSubmit={submit} noValidate>
            {errors.form && <p className="form-error">{errors.form}</p>}
            <section className="card form-section">
              <div className="section-title"><span>01</span><div><h2>Food details</h2><p>Tell customers what makes this meal special.</p></div></div>
              <div className="form-grid">
                <label className="food-field full"><span>Food name *</span><input name="name" value={form.name} onChange={update} placeholder="e.g. Chicken Rice & Curry" aria-invalid={!!errors.name} />{errors.name && <small className="form-error">{errors.name}</small>}</label>
                <label className="food-field"><span>Category *</span><select name="category" value={form.category} onChange={update} aria-invalid={!!errors.category}><option value="">Select a category</option><option>Rice & Curry</option><option>Kottu</option><option>Short Eats</option><option>Desserts</option><option>Bakes</option><option>Other</option></select>{errors.category && <small className="form-error">{errors.category}</small>}</label>
                <label className="food-field"><span>Preparation time</span><div className="input-suffix"><input name="prepTime" type="number" min="0" value={form.prepTime} onChange={update} placeholder="30" /><b>min</b></div></label>
                <label className="food-field full"><span>Description</span><textarea name="description" value={form.description} onChange={update} rows="4" placeholder="Describe the flavours, sides and portion size…" /><small>{form.description.length}/300 characters</small></label>
                <label className="food-field full"><span>Ingredients</span><textarea name="ingredients" value={form.ingredients} onChange={update} rows="3" placeholder="Rice, chicken, coconut milk, spices…" /><small>Separate each ingredient with a comma.</small></label>
              </div>
            </section>
            <section className="card form-section">
              <div className="section-title"><span>02</span><div><h2>Photo</h2><p>A clear photo helps customers choose with confidence.</p></div></div>
              <label className="image-upload">{preview ? <img src={preview} alt="Food preview" /> : <><b>＋</b><strong>Upload a food photo</strong><small>PNG or JPG, up to 5 MB</small></>}<input type="file" accept="image/png,image/jpeg" onChange={chooseImage} /></label>
            </section>
            <section className="card form-section">
              <div className="section-title"><span>03</span><div><h2>Price & availability</h2><p>Set today’s price and available quantity.</p></div></div>
              <div className="form-grid">
                <label className="food-field"><span>Price per portion *</span><div className="input-prefix"><b>Rs.</b><input name="price" type="number" min="1" value={form.price} onChange={update} placeholder="850" /></div>{errors.price && <small className="form-error">{errors.price}</small>}</label>
                <label className="food-field"><span>Available portions *</span><input name="portions" type="number" min="0" value={form.portions} onChange={update} placeholder="10" />{errors.portions && <small className="form-error">{errors.portions}</small>}</label>
                <label className="availability full"><span><strong>List as available</strong><small>Customers can find and order this food.</small></span><input name="available" type="checkbox" checked={form.available} onChange={update} /></label>
              </div>
            </section>
            <div className="form-actions"><Link to="/cook/foods" className="btn btn-secondary">Cancel</Link><button className="btn btn-primary" type="submit">{id ? 'Save Changes' : 'Add Food to Menu'}</button></div>
          </form>
        </div>
      </main>
    </div>
  )
}
