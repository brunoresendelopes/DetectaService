import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { ServiceOrder, Operator, Section } from './types';
import { INITIAL_SERVICE_ORDERS, INITIAL_OPERATORS, INITIAL_SECTIONS } from './mockData';

// Collection references
const ORDERS_COLLECTION = 'orders';
const OPERATORS_COLLECTION = 'operators';
const CONFIG_COLLECTION = 'config';

/**
 * Recursively removes all undefined properties from an object so Firestore doesn't reject it.
 */
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Seeds initial data to Firestore if the system has not been initialized yet.
 */
export async function seedInitialDataIfNeeded() {
  try {
    const passwordDocRef = doc(db, CONFIG_COLLECTION, 'system');
    const passwordDoc = await getDoc(passwordDocRef);
    
    // If system config document exists, we are already initialized. Skip seeding.
    if (passwordDoc.exists()) {
      console.log('System already initialized, skipping seeding.');
      return;
    }

    console.log('Initializing fresh database, seeding default data...');

    // Seed initial operators
    console.log('Seeding initial operators...');
    const opBatch = writeBatch(db);
    for (const op of INITIAL_OPERATORS) {
      const opRef = doc(db, OPERATORS_COLLECTION, op.id);
      opBatch.set(opRef, cleanUndefined(op));
    }
    await opBatch.commit();

    // Seed initial service orders
    console.log('Seeding initial service orders...');
    const orderBatch = writeBatch(db);
    for (const order of INITIAL_SERVICE_ORDERS) {
      const orderRef = doc(db, ORDERS_COLLECTION, order.id);
      orderBatch.set(orderRef, cleanUndefined(order));
    }
    await orderBatch.commit();

    // Mark system as initialized and set default password
    console.log('Seeding system configuration and password...');
    await setDoc(passwordDocRef, cleanUndefined({ 
      password: 'detecta2026',
      initialized: true,
      initializedAt: new Date().toISOString()
    }));

    // Seed initial sections
    console.log('Seeding initial sections...');
    const sectionsDocRef = doc(db, CONFIG_COLLECTION, 'sections');
    await setDoc(sectionsDocRef, cleanUndefined({ list: INITIAL_SECTIONS }));
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

/**
 * Saves sections list to Firestore.
 */
export async function saveSectionsToDb(sections: Section[]): Promise<void> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, 'sections');
    await setDoc(docRef, cleanUndefined({ list: sections }));
  } catch (error) {
    console.error('Error saving sections to Firestore:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time sections updates across devices.
 */
export function subscribeSections(onUpdate: (sections: Section[]) => void, onError?: (error: any) => void) {
  const docRef = doc(db, CONFIG_COLLECTION, 'sections');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists() && docSnap.data().list) {
      onUpdate(docSnap.data().list as Section[]);
    } else {
      onUpdate(INITIAL_SECTIONS);
    }
  }, (error) => {
    console.error('Error listening to sections updates:', error);
    if (onError) onError(error);
  });
}

/**
 * Fetch all service orders from Firestore.
 */
export async function fetchServiceOrders(): Promise<ServiceOrder[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ORDERS_COLLECTION));
    const orders: ServiceOrder[] = [];
    querySnapshot.forEach((doc) => {
      orders.push(doc.data() as ServiceOrder);
    });
    // Sort by code descending by default, or date
    return orders.sort((a, b) => b.code.localeCompare(a.code));
  } catch (error) {
    console.error('Error fetching service orders:', error);
    throw error;
  }
}

/**
 * Fetch all operators from Firestore.
 */
export async function fetchOperators(): Promise<Operator[]> {
  try {
    const querySnapshot = await getDocs(collection(db, OPERATORS_COLLECTION));
    const operators: Operator[] = [];
    querySnapshot.forEach((doc) => {
      operators.push(doc.data() as Operator);
    });
    return operators;
  } catch (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }
}

/**
 * Saves (creates or updates) a service order in Firestore.
 */
export async function saveServiceOrder(order: ServiceOrder): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(docRef, cleanUndefined(order));
  } catch (error) {
    console.error('Error saving service order:', error);
    throw error;
  }
}

/**
 * Deletes a service order from Firestore.
 */
export async function deleteServiceOrder(orderId: string): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting service order:', error);
    throw error;
  }
}

/**
 * Saves operators list to Firestore.
 */
export async function saveOperatorsToDb(operators: Operator[]): Promise<void> {
  try {
    // We can do a batch update: delete existing operators and set new ones,
    // or simply overwrite document-by-document.
    // For simplicity, we write each operator doc.
    const batch = writeBatch(db);
    for (const op of operators) {
      const docRef = doc(db, OPERATORS_COLLECTION, op.id);
      batch.set(docRef, cleanUndefined(op));
    }
    await batch.commit();
  } catch (error) {
    console.error('Error saving operators:', error);
    throw error;
  }
}

/**
 * Saves a single operator (for creation/edit).
 */
export async function saveOperator(op: Operator): Promise<void> {
  try {
    const docRef = doc(db, OPERATORS_COLLECTION, op.id);
    await setDoc(docRef, cleanUndefined(op));
  } catch (error) {
    console.error('Error saving operator:', error);
    throw error;
  }
}

/**
 * Deletes a single operator (or marks inactive, but here we can support deleting/disabling).
 */
export async function deleteOperatorFromDb(opId: string): Promise<void> {
  try {
    const docRef = doc(db, OPERATORS_COLLECTION, opId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting operator:', error);
    throw error;
  }
}

/**
 * Fetches the system access password from Firestore.
 */
export async function fetchSystemPassword(): Promise<string> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, 'system');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().password || 'detecta2026';
    }
    return 'detecta2026';
  } catch (error) {
    console.error('Error fetching system password:', error);
    return 'detecta2026'; // Fallback
  }
}

/**
 * Updates the system access password in Firestore.
 */
export async function updateSystemPassword(newPassword: string): Promise<void> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, 'system');
    await setDoc(docRef, cleanUndefined({ password: newPassword }), { merge: true });
  } catch (error) {
    console.error('Error updating system password:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time service orders updates across devices.
 */
export function subscribeServiceOrders(onUpdate: (orders: ServiceOrder[]) => void, onError?: (error: any) => void) {
  const q = collection(db, ORDERS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    const orders: ServiceOrder[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as ServiceOrder;
      if (data) {
        orders.push({
          ...data,
          id: data.id || doc.id,
          code: data.code || ''
        });
      }
    });
    // Safe sort by code descending (e.g. "OS-002" vs "OS-001")
    orders.sort((a, b) => {
      const codeA = String(a.code || '');
      const codeB = String(b.code || '');
      return codeB.localeCompare(codeA);
    });
    onUpdate(orders);
  }, (error) => {
    console.error('Error listening to service orders updates:', error);
    if (onError) onError(error);
  });
}

/**
 * Subscribe to real-time operators updates across devices.
 */
export function subscribeOperators(onUpdate: (operators: Operator[]) => void, onError?: (error: any) => void) {
  const q = collection(db, OPERATORS_COLLECTION);
  return onSnapshot(q, (snapshot) => {
    const operators: Operator[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Operator;
      if (data) {
        operators.push({
          ...data,
          id: data.id || doc.id,
          name: data.name || ''
        });
      }
    });
    // Safe sort by operator name
    operators.sort((a, b) => {
      const nameA = String(a.name || '');
      const nameB = String(b.name || '');
      return nameA.localeCompare(nameB);
    });
    onUpdate(operators);
  }, (error) => {
    console.error('Error listening to operators updates:', error);
    if (onError) onError(error);
  });
}

/**
 * Subscribe to real-time system password updates across devices.
 */
export function subscribeSystemPassword(onUpdate: (password: string) => void, onError?: (error: any) => void) {
  const docRef = doc(db, CONFIG_COLLECTION, 'system');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data().password || 'detecta2026');
    } else {
      onUpdate('detecta2026');
    }
  }, (error) => {
    console.error('Error listening to system password updates:', error);
    if (onError) onError(error);
  });
}
