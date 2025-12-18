'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
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
  const { user, loading: isAuthLoading } = useAuth();
  const [data, setData] = useState<WithId<T>[] | null>([]);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the query constraints array to stabilize the useEffect dependency.
  const constraintsString = useMemo(() => queryConstraints.map(c => c.type).join(','), [queryConstraints]);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }
    
    // Although rules are open, it's good practice to wait for authentication.
    if (!user) {
        setIsLoading(false);
        setData([]);
        return;
    }

    const q = query(collection(db, collectionName), ...queryConstraints);

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
  // We use a string representation of constraints because the array itself is a new object on each render.
  }, [collectionName, user, isAuthLoading, constraintsString]);

  return { data, error, isLoading };
}
