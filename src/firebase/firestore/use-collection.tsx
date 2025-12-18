'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/firebase/auth';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export function useCollection<T = any>(
  collectionName: string,
  ...queryConstraints: QueryConstraint[]
): UseCollectionResult<T> {
  const { user, loading } = useAuth();
  const [data, setData] = useState<WithId<T>[] | null>([]);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      setIsLoading(true);
      return;
    }

    if (!user) {
      setData([]);
      setIsLoading(false);
      return;
    }

    let q: Query;
    const baseCollection = collection(db, collectionName);
    
    const constraints: QueryConstraint[] = [...queryConstraints];

    // If user is a driver, add a constraint to fetch only their own checklists.
    // This logic is specific and should be handled carefully.
    if (collectionName === 'checklists' && user.role === 'driver') {
      constraints.push(where('userId', '==', user.uid));
    }
    
    q = query(baseCollection, ...constraints);


    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as WithId<T>[];

        setData(docs);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error(`Error fetching collection ${collectionName}:`, err);
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: collectionName,
        });
        setError(contextualError);
        errorEmitter.emit('permission-error', contextualError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, user, loading, ...queryConstraints]);

  return { data, error, isLoading };
}
