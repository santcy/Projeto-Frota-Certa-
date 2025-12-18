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
  orderBy,
  limit,
  QueryConstraint
} from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useAuth } from '@/context/auth-context';
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
  const { user, isUserLoading } = useAuth();
  const firestore = useFirestore();
  const [data, setData] = useState<WithId<T>[] | null>([]);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !firestore) {
      setIsLoading(true);
      return;
    }

    if (!user) {
      setData([]);
      setIsLoading(false);
      return;
    }

    let q: Query;
    const baseCollection = collection(firestore, collectionName);

    // Admins can see everything, drivers only see their own checklists.
    if (collectionName === 'checklists' && user.role === 'driver') {
      q = query(baseCollection, where('userId', '==', user.uid), ...queryConstraints);
    } else {
      q = query(baseCollection, ...queryConstraints);
    }

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
  }, [collectionName, user, isUserLoading, firestore, ...queryConstraints]);

  return { data, error, isLoading };
}
