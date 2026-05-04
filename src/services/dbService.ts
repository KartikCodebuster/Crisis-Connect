import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  GeoPoint,
  getDoc,
  setDoc,
  deleteDoc,
  limit,
  endAt,
  startAt,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { calculateDistance } from '../lib/utils';

export enum EmergencyStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  RESOLVED = 'resolved'
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

export interface EmergencyRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterPhone?: string;
  requesterPhoto: string | null;
  circleIds?: string[]; // IDs of circles the requester belongs to
  location: { lat: number; lng: number };
  geohash: string;
  status: EmergencyStatus;
  helperId: string | null;
  helperName: string | null;
  description: string;
  circleId?: string | null; // Targeted circle for guardian alerts
  createdAt: any;
  updatedAt: any;
}

export interface Circle {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: any;
}


// Error handler as per Firebase integration instructions
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const updateUserProfile = async (data: { phoneNumber?: string; displayName?: string }) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `users/${userId}`;
  
  try {
    await setDoc(doc(db, 'users', userId), {
      ...data,
      uid: userId,
      email: auth.currentUser.email,
      photoURL: auth.currentUser.photoURL,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getUserProfile = async (userId: string) => {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const createEmergency = async (lat: number, lng: number, geohash: string, description: string = 'Emergency help requested') => {
  if (!auth.currentUser) return;
  
  const userId = auth.currentUser.uid;
  const path = 'emergencies';
  
  try {
    // Get user's circle memberships to tag the SOS
    const membershipsSnap = await getDocs(collection(db, `users/${userId}/memberships`));
    const circleIds = membershipsSnap.docs.map(doc => doc.id);

    // Get user's profile for phone number
    const userSnap = await getDoc(doc(db, 'users', userId));
    const userData = userSnap.data();

    await addDoc(collection(db, path), {
      requesterId: userId,
      requesterName: auth.currentUser.displayName || 'Anonymous User',
      requesterPhone: userData?.phoneNumber || '',
      requesterPhoto: auth.currentUser.photoURL,
      circleIds,
      location: { lat, lng },
      geohash,
      status: EmergencyStatus.PENDING,
      helperId: null,
      helperName: null,
      description,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const acceptEmergency = async (emergencyId: string) => {
  if (!auth.currentUser) return;
  
  const path = `emergencies/${emergencyId}`;
  try {
    await updateDoc(doc(db, 'emergencies', emergencyId), {
      status: EmergencyStatus.ACCEPTED,
      helperId: auth.currentUser.uid,
      helperName: auth.currentUser.displayName || 'Helper',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const resolveEmergency = async (emergencyId: string) => {
  const path = `emergencies/${emergencyId}`;
  try {
    await updateDoc(doc(db, 'emergencies', emergencyId), {
      status: EmergencyStatus.RESOLVED,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const subscribeToNearbyEmergencies = (
  centerLat: number, 
  centerLng: number, 
  radiusInMeters: number, 
  onUpdate: (emergencies: EmergencyRequest[]) => void
) => {
  const center: [number, number] = [centerLat, centerLng];
  const bounds = geohashQueryBounds(center, radiusInMeters);
  const path = 'emergencies';

  const promises = bounds.map(b => {
    const q = query(
      collection(db, path),
      orderBy('geohash'),
      startAt(b[0]),
      endAt(b[1]),
      where('status', '!=', EmergencyStatus.RESOLVED)
    );
    
    return q;
  });

  // Simplified: standard onSnapshot for now, geofire-common logic is better with multiple queries
  // But for this app, we'll listen to all active emergencies and filter client-side for simplicity in the prototype
  // unless there are many.
  
  const q = query(
    collection(db, path),
    where('status', '!=', EmergencyStatus.RESOLVED),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const emergencies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EmergencyRequest));

    // Filter by actual distance on client side
    const filtered = emergencies.filter(e => {
      const distance = calculateDistance(centerLat, centerLng, e.location.lat, e.location.lng);
      return distance <= radiusInMeters;
    }).sort((a, b) => {
      const distA = calculateDistance(centerLat, centerLng, a.location.lat, a.location.lng);
      const distB = calculateDistance(centerLat, centerLng, b.location.lat, b.location.lng);
      return distA - distB;
    });

    onUpdate(filtered);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToMyRequests = (callback: (emergency: EmergencyRequest | null) => void) => {
  if (!auth.currentUser) return () => {};
  
  const q = query(
    collection(db, 'emergencies'),
    where('requesterId', '==', auth.currentUser.uid),
    where('status', '!=', EmergencyStatus.RESOLVED),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
    } else {
      callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as EmergencyRequest);
    }
  });
};

export const subscribeToMyAssignments = (callback: (emergencies: EmergencyRequest[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const q = query(
    collection(db, 'emergencies'),
    where('helperId', '==', auth.currentUser.uid),
    where('status', '==', EmergencyStatus.ACCEPTED)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyRequest)));
  });
};

export const sendMessage = async (emergencyId: string, text: string) => {
  if (!auth.currentUser) return;
  
  const path = `emergencies/${emergencyId}/messages`;
  try {
    await addDoc(collection(db, path), {
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || 'User',
      text,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export interface CircleMember {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  joinedAt: any;
}

// Circle Management
export const createCircle = async (name: string) => {
  if (!auth.currentUser) return;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const circlePath = 'circles';
  const userId = auth.currentUser.uid;
  
  try {
    const docRef = await addDoc(collection(db, circlePath), {
      name,
      ownerId: userId,
      inviteCode,
      createdAt: serverTimestamp(),
    });
    
    // Add creator as member
    const memberData: CircleMember = {
      uid: userId,
      displayName: auth.currentUser.displayName,
      photoURL: auth.currentUser.photoURL,
      joinedAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, `circles/${docRef.id}/members`, userId), memberData);
    
    // Add to mapping and memberships
    await setDoc(doc(db, 'inviteCodes', inviteCode), { circleId: docRef.id });
    await setDoc(doc(db, `users/${userId}/memberships`, docRef.id), { 
      circleId: docRef.id,
      name, // Store name for offline/fast listing
      joinedAt: serverTimestamp() 
    });
    
    return { id: docRef.id, inviteCode };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, circlePath);
  }
};

export const joinCircle = async (inviteCode: string) => {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const normalizedCode = inviteCode.toUpperCase();
  
  try {
    // 1. Find circle ID from mapping
    const codeSnap = await getDoc(doc(db, 'inviteCodes', normalizedCode));
    if (!codeSnap.exists()) throw new Error('Invalid invite code');
    
    const { circleId } = codeSnap.data();
    
    // 2. Get circle metadata
    const circleSnap = await getDoc(doc(db, 'circles', circleId));
    if (!circleSnap.exists()) throw new Error('Circle no longer exists');
    const circleData = circleSnap.data();
    
    // 3. Update both locations
    const memberData: CircleMember = {
      uid: userId,
      displayName: auth.currentUser.displayName,
      photoURL: auth.currentUser.photoURL,
      joinedAt: serverTimestamp(),
    };

    await setDoc(doc(db, `circles/${circleId}/members`, userId), memberData);
    
    await setDoc(doc(db, `users/${userId}/memberships`, circleId), {
      circleId,
      name: circleData.name,
      joinedAt: serverTimestamp()
    });
    
    return circleId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'circles/join');
  }
};

export const subscribeToCircleMembers = (circleId: string, callback: (members: CircleMember[]) => void) => {
  const path = `circles/${circleId}/members`;
  const q = query(collection(db, path), orderBy('joinedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data() } as CircleMember)));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const removeCircleMember = async (circleId: string, targetUserId: string) => {
  if (!auth.currentUser) return;
  
  try {
    // 1. Remove from members subcollection
    await deleteDoc(doc(db, `circles/${circleId}/members`, targetUserId));
    
    // 2. Remove membership from user's record
    await deleteDoc(doc(db, `users/${targetUserId}/memberships`, circleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `circles/${circleId}/members/${targetUserId}`);
  }
};

export const subscribeToMyCircles = (callback: (circles: Circle[]) => void) => {
  if (!auth.currentUser) return () => {};
  const userId = auth.currentUser.uid;
  
  const q = query(collection(db, `users/${userId}/memberships`), orderBy('joinedAt', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    const circlePromises = snapshot.docs.map(async (membershipDoc) => {
      const data = membershipDoc.data();
      // Fetch full circle data to get ownerId and inviteCode
      const circleSnap = await getDoc(doc(db, 'circles', data.circleId));
      if (circleSnap.exists()) {
        return { id: circleSnap.id, ...circleSnap.data() } as Circle;
      }
      return null;
    });
    
    const circles = await Promise.all(circlePromises);
    callback(circles.filter((c): c is Circle => c !== null));
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/memberships`);
  });
};

export const subscribeToMyCircleAlerts = (circleIds: string[], callback: (emergencies: EmergencyRequest[]) => void) => {
  if (!auth.currentUser || circleIds.length === 0) {
    callback([]);
    return () => {};
  }
  
  // Use array-contains-any to filter for SOS signals tagged with user's circle IDs
  // Limited to 30 circles by Firestore
  const q = query(
    collection(db, 'emergencies'),
    where('status', '==', EmergencyStatus.PENDING),
    where('circleIds', 'array-contains-any', circleIds.slice(0, 30)),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyRequest)));
  }, (error) => {
    // If index is missing, it will log a helpful link in console
    handleFirestoreError(error, OperationType.LIST, 'emergencies/circle-alerts');
  });
};


export const subscribeToMessages = (emergencyId: string, callback: (messages: Message[]) => void) => {
  const path = `emergencies/${emergencyId}/messages`;
  const q = query(
    collection(db, path),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

// Admin Telemetry Services
export const subscribeToGlobalEmergencies = (callback: (emergencies: EmergencyRequest[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const q = query(
    collection(db, 'emergencies'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyRequest)));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'emergencies/global');
  });
};

export const subscribeToGlobalUsers = (callback: (users: any[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const q = query(
    collection(db, 'users'),
    orderBy('updatedAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'users/global');
  });
};

export const subscribeToGlobalCircles = (callback: (circles: any[]) => void) => {
  if (!auth.currentUser) return () => {};
  
  const q = query(
    collection(db, 'circles'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'circles/global');
  });
};
