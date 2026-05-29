import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

let activeConfig = firebaseConfig;

try {
  const localOverrideStr = typeof window !== 'undefined' ? window.localStorage.getItem('basak_khana_khajana_firebase_override') : null;
  if (localOverrideStr) {
    const parsed = JSON.parse(localOverrideStr);
    if (parsed && parsed.apiKey && parsed.apiKey.trim() !== "") {
      activeConfig = parsed;
      console.log("Firebase overriding with custom local browser parameters (localStorage).");
    }
  }
} catch (e) {
  console.error("Failed to load local Firebase override config:", e);
}

// Safe check: Is copy of config actual credentials
const isSyncDisabledStr = typeof window !== 'undefined' ? window.localStorage.getItem('basak_khana_khajana_firebase_disabled') === 'true' : false;
const isFirebaseEnabled = !!(activeConfig && activeConfig.apiKey && activeConfig.apiKey.trim() !== "") && !isSyncDisabledStr;

let app;
let db: any = null;
let auth: any = null;

if (isFirebaseEnabled) {
  try {
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    db = getFirestore(app, activeConfig.firestoreDatabaseId || 'default');
    auth = getAuth(app);
    console.log("Firebase initialized successfully with cloud sync activated.");

    // Validate connection to Firestore initially
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. Client is offline.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error("Failed to initialize Firebase SDK:", err);
  }
} else {
  console.log("Firebase configuration is not completed yet. Falling back to Express API/LocalStorage engines.");
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { db, auth, isFirebaseEnabled, activeConfig };

