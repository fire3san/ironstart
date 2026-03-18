/**
 * Migration Service - Handles localStorage to Firestore data migration
 * For existing users who have local progress data
 */

// LocalStorage keys used by IronStart
const STORAGE_KEYS = {
  HISTORY: 'ironstart_history',
  FOOD: 'ironstart_food',
  METRICS: 'ironstart_metrics',
  WATER: 'ironstart_water',
  WELLNESS: 'ironstart_wellness',
  PRS: 'ironstart_prs',
  GOALS: 'ironstart_goals',
  ACTIVE_WORKOUT: 'ironstart_active_workout',
  LANG: 'ironstart_lang',
  MODE: 'ironstart_mode'
};

/**
 * Check if user has any local data stored
 * @returns {Object} Object with hasLocalData boolean and available data types
 */
export const checkForLocalData = () => {
  const dataTypes = {};
  let hasAnyData = false;

  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    if (key === 'LANG' || key === 'MODE') return; // Skip preferences
    
    try {
      const item = localStorage.getItem(storageKey);
      if (item) {
        const parsed = JSON.parse(item);
        dataTypes[key.toLowerCase()] = {
          exists: true,
          size: JSON.stringify(parsed).length,
          preview: getPreview(parsed, key)
        };
        hasAnyData = true;
      }
    } catch (e) {
      console.warn(`Error parsing ${storageKey}:`, e);
      dataTypes[key.toLowerCase()] = { exists: false, error: true };
    }
  });

  return { hasLocalData: hasAnyData, dataTypes };
};

/**
 * Get a preview of the data for display purposes
 */
const getPreview = (data, key) => {
  try {
    switch (key) {
      case 'HISTORY':
        return {
          workouts: Array.isArray(data) ? data.length : 0,
          lastWorkout: data[0]?.completedAt ? new Date(data[0].completedAt).toLocaleDateString() : 'N/A'
        };
      case 'METRICS':
        return {
          entries: Array.isArray(data) ? data.length : 0,
          latest: data[0] ? `${data[0].weight}kg` : 'N/A'
        };
      case 'FOOD':
        return { items: Array.isArray(data) ? data.length : 0 };
      case 'GOALS':
        return data ? { targetWeight: data.targetWeight } : null;
      case 'PRS':
        return data ? { records: Object.keys(data).length } : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
};

/**
 * Get all local data for migration
 * @returns {Object} All local data organized by type
 */
export const getAllLocalData = () => {
  const localData = {};

  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    if (key === 'LANG' || key === 'MODE') return;
    
    try {
      const item = localStorage.getItem(storageKey);
      if (item) {
        localData[key.toLowerCase()] = JSON.parse(item);
      }
    } catch (e) {
      console.warn(`Error parsing ${storageKey}:`, e);
    }
  });

  return localData;
};

/**
 * Merge local data with remote (Firestore) data
 * Strategy: Prefer remote data but merge unique local entries
 * @param {Object} localData - Data from localStorage
 * @param {Object} remoteData - Data from Firestore
 * @returns {Object} Merged data
 */
export const mergeData = (localData, remoteData) => {
  const merged = {};

  // Merge workout history - combine unique entries, prefer remote for conflicts
  if (localData.history || remoteData?.history) {
    const localHistory = localData?.history || [];
    const remoteHistory = remoteData?.history || [];
    
    // Create a map of remote workouts by ID for quick lookup
    const remoteWorkoutIds = new Set(remoteHistory.map(w => w.id));
    
    // Find local workouts not in remote (by ID or by timestamp if no ID)
    const uniqueLocalWorkouts = localHistory.filter(local => {
      if (local.id && remoteWorkoutIds.has(local.id)) {
        return false; // Already exists in remote
      }
      // Check for duplicate by timestamp and type
      const isDuplicate = remoteHistory.some(remote => 
        Math.abs(new Date(remote.completedAt) - new Date(local.completedAt)) < 60000 &&
        remote.type === local.type
      );
      return !isDuplicate;
    });

    merged.history = [...remoteHistory, ...uniqueLocalWorkouts].sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
    );
  }

  // Merge body metrics - combine unique entries by date
  if (localData.metrics || remoteData?.metrics) {
    const localMetrics = localData?.metrics || [];
    const remoteMetrics = remoteData?.metrics || [];
    
    const remoteMetricDates = new Set(remoteMetrics.map(m => m.date));
    const uniqueLocalMetrics = localMetrics.filter(
      m => !remoteMetricDates.has(m.date)
    );

    merged.metrics = [...remoteMetrics, ...uniqueLocalMetrics].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }

  // Merge goals - prefer local if more recent or if remote doesn't exist
  if (localData.goals || remoteData?.goals) {
    if (remoteData?.goals && localData?.goals) {
      // Keep remote goals but update if local has newer data
      merged.goals = remoteData.goals;
      if (localData.goals.createdAt > remoteData.goals.createdAt) {
        merged.goals = localData.goals;
      }
    } else {
      merged.goals = localData.goals || remoteData.goals;
    }
  }

  // Merge personal records - take the max of each
  if (localData.prs || remoteData?.prs) {
    merged.prs = { ...(remoteData?.prs || {}) };
    Object.entries(localData?.prs || {}).forEach(([key, value]) => {
      if (!merged.prs[key] || value > merged.prs[key]) {
        merged.prs[key] = value;
      }
    });
  }

  // For food, water, wellness - use local (today's data)
  if (localData.food) merged.food = localData.food;
  if (localData.water) merged.water = localData.water;
  if (localData.wellness) merged.wellness = localData.wellness;

  // Keep preferences
  if (localData.lang) merged.lang = localData.lang;
  if (localData.mode) merged.mode = localData.mode;

  return merged;
};

/**
 * Migrate local data to Firestore
 * @param {string} userId - Firebase user ID
 * @param {Object} localData - Local data to migrate
 * @param {Object} db - Firestore database instance
 * @returns {Promise<Object>} Migration result
 */
export const migrateLocalData = async (userId, localData, db) => {
  if (!db || !userId) {
    throw new Error('Database instance and userId are required');
  }

  const results = {
    success: true,
    migrated: [],
    failed: [],
    stats: {}
  };

  // Import Firestore functions
  const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');

  try {
    const userRef = doc(db, 'users', userId);

    // Migrate each data type
    const migrationTasks = Object.entries(localData).map(async ([dataType, data]) => {
      try {
        await setDoc(userRef, {
          [dataType]: data,
          migratedAt: serverTimestamp()
        }, { merge: true });
        
        results.migrated.push(dataType);
        results.stats[dataType] = Array.isArray(data) ? data.length : 1;
      } catch (error) {
        console.error(`Failed to migrate ${dataType}:`, error);
        results.failed.push({ type: dataType, error: error.message });
        results.success = false;
      }
    });

    await Promise.all(migrationTasks);

    return results;
  } catch (error) {
    results.success = false;
    results.error = error.message;
    return results;
  }
};

/**
 * Clear localStorage after successful migration
 * @param {boolean} clearPreferences - Whether to also clear lang/mode preferences
 */
export const clearLocalData = (clearPreferences = false) => {
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    if ((key === 'LANG' || key === 'MODE') && !clearPreferences) return;
    localStorage.removeItem(storageKey);
  });
  
  console.log('Local data cleared');
};

/**
 * Save data to Firestore (for ongoing sync after migration)
 * @param {string} userId - Firebase user ID
 * @param {string} dataType - Type of data to save
 * @param {any} data - Data to save
 * @param {Object} db - Firestore database instance
 */
export const saveToFirestore = async (userId, dataType, data, db) => {
  if (!db || !userId) return;

  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      [dataType]: data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error(`Failed to save ${dataType} to Firestore:`, error);
  }
};

/**
 * Load data from Firestore
 * @param {string} userId - Firebase user ID
 * @param {Object} db - Firestore database instance
 * @returns {Promise<Object>} User data from Firestore
 */
export const loadFromFirestore = async (userId, db) => {
  if (!db || !userId) return null;

  const { doc, getDoc } = await import('firebase/firestore');
  
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Failed to load from Firestore:', error);
    return null;
  }
};

/**
 * Check if user has remote data in Firestore
 * @param {string} userId - Firebase user ID
 * @param {Object} db - Firestore database instance
 * @returns {Promise<Object|null>} Remote user data or null
 */
export const checkForRemoteData = async (userId, db) => {
  if (!db || !userId) return null;
  return await loadFromFirestore(userId, db);
};

/**
 * Merge local and remote data (alias for mergeData)
 * @param {Object} localData - Data from localStorage
 * @param {Object} remoteData - Data from Firestore
 * @returns {Object} Merged data
 */
export const mergeLocalAndRemoteData = (localData, remoteData) => {
  return mergeData(localData, remoteData);
};

/**
 * Save user data to Firestore (alias for saveToFirestore)
 * @param {string} userId - Firebase user ID
 * @param {Object} data - Complete user data to save
 * @param {Object} db - Firestore database instance
 * @returns {Promise<void>}
 */
export const saveUserDataToFirestore = async (userId, data, db) => {
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to save user data to Firestore:', error);
    throw error;
  }
};

/**
 * Get user data from Firestore (alias for loadFromFirestore)
 * @param {string} userId - Firebase user ID
 * @param {Object} db - Firestore database instance
 * @returns {Promise<Object|null>} User data from Firestore
 */
export const getUserDataFromFirestore = async (userId, db) => {
  return await loadFromFirestore(userId, db);
};

export default {
  checkForLocalData,
  getAllLocalData,
  mergeData,
  mergeLocalAndRemoteData,
  migrateLocalData,
  clearLocalData,
  saveToFirestore,
  saveUserDataToFirestore,
  loadFromFirestore,
  getUserDataFromFirestore,
  checkForRemoteData
};
