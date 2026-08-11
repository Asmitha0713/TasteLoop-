import { useState } from 'react'
import api, { apiError } from '../services/api.js'

export default function ReviewForm({ food, onClose, onSaved }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async event => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post(`/foods/${food.food_id || food.id}/reviews`, { rating, comment: comment.trim() })
      onSaved?.(data.data)
      onClose()
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="review-modal" role="presentation" onMouseDown={onClose}>
    <section className="card review-dialog" role="dialog" aria-modal="true" aria-labelledby="review-title" onMouseDown={event => event.stopPropagation()}>
      <button type="button" className="review-close" onClick={onClose} aria-label="Close review form">×</button>
      <span className="eyebrow">Share your experience</span>
      <h2 id="review-title">Review {food.name}</h2>
      <p>Your review helps other customers choose trusted homemade food.</p>
      <form onSubmit={submit}>
        <fieldset className="review-rating"><legend>Your rating</legend>{[1, 2, 3, 4, 5].map(value => <button type="button" key={value} className={value <= rating ? 'selected' : ''} onClick={() => setRating(value)} aria-label={`${value} star${value === 1 ? '' : 's'}`}>★</button>)}</fieldset>
        <label className="food-field"><span>Comment (optional)</span><textarea rows="5" maxLength="1000" value={comment} onChange={event => setComment(event.target.value)} placeholder="Tell others what you liked about this meal…" /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="review-actions"><button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button><button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Submit review'}</button></div>
      </form>
    </section>
  </div>
}
