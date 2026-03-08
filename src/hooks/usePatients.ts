/**
 * hooks/usePatients.ts — Hook para gestión de pacientes con Supabase.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Patient } from '../types'

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setPatients(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pacientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const createPatient = async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error: err } = await supabase
      .from('patients')
      .insert([patient])
      .select()
      .single()

    if (err) throw err
    setPatients((prev) => [data, ...prev])
    return data as Patient
  }

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    const { data, error: err } = await supabase
      .from('patients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (err) throw err
    setPatients((prev) => prev.map((p) => (p.id === id ? data : p)))
    return data as Patient
  }

  return { patients, loading, error, refetch: fetchPatients, createPatient, updatePatient }
}

export function usePatient(id: string | undefined) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatient = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err
      setPatient(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar paciente')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])

  const updatePatient = async (updates: Partial<Patient>) => {
    if (!id) return
    const { data, error: err } = await supabase
      .from('patients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (err) throw err
    setPatient(data)
    return data as Patient
  }

  return { patient, loading, error, refetch: fetchPatient, updatePatient }
}
