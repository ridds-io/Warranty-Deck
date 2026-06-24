// =============================================================================
// WARRANTYDECK — useReimbursementFolders
// src/hooks/useReimbursementFolders.js
// =============================================================================

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function mapFolder(row) {
    return {
        id: row.id,
        folderName: row.folder_name,
        description: row.description || '',
        status: row.status || 'active',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        receiptCount: row.receipt_count || 0,
        totalAmount: Number(row.total_amount || 0),
    }
}

export function useReimbursementFolders() {
    const { user } = useAuth()
    const [folders, setFolders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchFolders = useCallback(async () => {
        if (!user) {
            setFolders([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        const { data, error: queryError } = await supabase
            .from('reimbursement_folder_summaries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (queryError) {
            setError(queryError)
            setFolders([])
        } else {
            setFolders((data || []).map(mapFolder))
        }

        setLoading(false)
    }, [user])

    const createFolder = useCallback(async (folderName, description = '') => {
        if (!user) return { error: 'User not authenticated' }

        const { data, error } = await supabase
            .from('reimbursement_folders')
            .insert({
                user_id: user.id,
                folder_name: folderName,
                description: description,
                status: 'active',
            })
            .select()
            .single()

        if (!error) {
            await fetchFolders()
        }

        return { data, error }
    }, [user, fetchFolders])

    const updateFolder = useCallback(async (folderId, updates) => {
        if (!user) return { error: 'User not authenticated' }

        const updateData = {}
        if (updates.folderName !== undefined) updateData.folder_name = updates.folderName
        if (updates.description !== undefined) updateData.description = updates.description
        if (updates.status !== undefined) updateData.status = updates.status

        const { data, error } = await supabase
            .from('reimbursement_folders')
            .update(updateData)
            .eq('id', folderId)
            .eq('user_id', user.id)
            .select()
            .single()

        if (!error) {
            await fetchFolders()
        }

        return { data, error }
    }, [user, fetchFolders])

    const deleteFolder = useCallback(async (folderId) => {
        if (!user) return { error: 'User not authenticated' }

        // First, unlink all receipts from this folder
        await supabase
            .from('receipts')
            .update({ reimbursement_folder_id: null })
            .eq('reimbursement_folder_id', folderId)
            .eq('user_id', user.id)

        // Then delete the folder
        const { error } = await supabase
            .from('reimbursement_folders')
            .delete()
            .eq('id', folderId)
            .eq('user_id', user.id)

        if (!error) {
            await fetchFolders()
        }

        return { error }
    }, [user, fetchFolders])

    useEffect(() => {
        fetchFolders()
    }, [fetchFolders])

    return {
        folders,
        loading,
        error,
        refresh: fetchFolders,
        createFolder,
        updateFolder,
        deleteFolder,
    }
}

export function useReimbursementFolder(folderId) {
    const { user } = useAuth()
    const [folder, setFolder] = useState(null)
    const [receipts, setReceipts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchFolder = useCallback(async () => {
        if (!user || !folderId) {
            setFolder(null)
            setReceipts([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        // Fetch folder summary
        const { data: folderData, error: folderError } = await supabase
            .from('reimbursement_folder_summaries')
            .select('*')
            .eq('id', folderId)
            .eq('user_id', user.id)
            .single()

        if (folderError) {
            setError(folderError)
            setFolder(null)
            setReceipts([])
            setLoading(false)
            return
        }

        setFolder(mapFolder(folderData))

        // Fetch receipts in this folder
        const { data: receiptsData, error: receiptsError } = await supabase
            .from('receipts')
            .select('*, receipt_items(*)')
            .eq('reimbursement_folder_id', folderId)
            .eq('user_id', user.id)
            .order('purchase_date', { ascending: false })

        if (receiptsError) {
            setError(receiptsError)
            setReceipts([])
        } else {
            setReceipts(receiptsData || [])
        }

        setLoading(false)
    }, [user, folderId])

    useEffect(() => {
        fetchFolder()
    }, [fetchFolder])

    return { folder, receipts, loading, error, refresh: fetchFolder }
}
