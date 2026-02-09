/**
 * Optimistic UI Update Utilities
 * 
 * These utilities help implement optimistic updates for better UX.
 * Updates the UI immediately, then syncs with the server.
 */

export interface OptimisticUpdateOptions<T> {
  currentValue: T
  optimisticValue: T
  updateFn: () => Promise<T>
  onSuccess?: (result: T) => void
  onError?: (error: Error, rollbackValue: T) => void
  rollback?: boolean
}

/**
 * Perform an optimistic update
 * Updates UI immediately, then syncs with server
 */
export async function optimisticUpdate<T>({
  currentValue,
  optimisticValue,
  updateFn,
  onSuccess,
  onError,
  rollback = true,
}: OptimisticUpdateOptions<T>): Promise<T> {
  // Store original value for rollback
  const originalValue = currentValue

  try {
    // Call success callback with optimistic value immediately
    if (onSuccess) {
      onSuccess(optimisticValue)
    }

    // Perform actual update
    const result = await updateFn()

    // Call success callback with actual result
    if (onSuccess) {
      onSuccess(result)
    }

    return result
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    
    // Rollback to original value on error
    if (rollback && onError) {
      onError(err, originalValue)
    } else if (rollback && onSuccess) {
      onSuccess(originalValue)
    }

    throw err
  }
}

/**
 * Batch optimistic updates
 */
export async function optimisticBatch<T>(
  updates: Array<() => Promise<T>>
): Promise<T[]> {
  const results: T[] = []
  const errors: Error[] = []

  // Execute all updates in parallel
  const promises = updates.map(async (updateFn) => {
    try {
      const result = await updateFn()
      results.push(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.push(err)
      throw err
    }
  })

  await Promise.allSettled(promises)

  if (errors.length > 0) {
    throw new Error(`Batch update failed: ${errors.map(e => e.message).join(", ")}`)
  }

  return results
}
