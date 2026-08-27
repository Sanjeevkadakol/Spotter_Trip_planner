import { useState, useCallback } from 'react'
import { planTrip } from '../services/api'

const STEPS = [
  'Geocoding locations...',
  'Calculating route...',
  'Generating HOS schedule...',
  'Generating ELD logs...',
  'Finalizing results...',
]

export function useTripPlanner() {
  const [state, setState] = useState('idle') // idle | loading | success | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [loadingText, setLoadingText] = useState('')

  const plan = useCallback(async (formData) => {
    setState('loading')
    setError(null)
    setResult(null)
    setLoadingStep(0)

    // Simulate step-by-step progress
    let stepIdx = 0
    const stepInterval = setInterval(() => {
      if (stepIdx < STEPS.length - 1) {
        stepIdx++
        setLoadingStep(stepIdx)
        setLoadingText(STEPS[stepIdx])
      }
    }, 1200)

    setLoadingText(STEPS[0])

    try {
      const data = await planTrip(formData)
      clearInterval(stepInterval)
      setResult(data)
      setState('success')
    } catch (err) {
      clearInterval(stepInterval)
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message ||
        'An unexpected error occurred. Please try again.'
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg)
      setState('error')
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setError(null)
    setLoadingStep(0)
  }, [])

  return { state, result, error, loadingStep, loadingText, plan, reset, STEPS }
}
