'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

// ---- Types ----
interface UserProfile {
  email: string;
  role?: string;
  ownedSupporterId?: string | string[];
}

interface SupporterData {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  [key: string]: any;
}

export default function SupporterDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [supporterData, setSupporterData] = useState<SupporterData | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChinese, setIsChinese] = useState(false);

  // Detect browser language
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsChinese(navigator.language.startsWith('zh'));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          setProfile(data);

          if (data.role === 'supporter' && data.ownedSupporterId) {
            // Normalize ownedSupporterId to array
            const supporterIds = Array.isArray(data.ownedSupporterId)
              ? data.ownedSupporterId
              : [data.ownedSupporterId];

            if (supporterIds.length > 0) {
              const supporterId = supporterIds[0]; // use only first for now
              setSlug(supporterId);

              const supporterDoc = await getDoc(doc(db, 'supporters', supporterId));
              if (supporterDoc.exists()) {
                setSupporterData(supporterDoc.data() as SupporterData);
              } else {
                console.warn('Supporter doc not found:', supporterId);
              }
            }
          }
        } else {
          console.error('User document not found!');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-6 text-center">{isChinese ? '加载中...' : 'Loading...'}</div>;

  if (!user || !profile) {
    return (
      <div className="p-6 text-center">
        <p>
          {isChinese ? (
            <>
              请{' '}
              <Link href="/account" className="text-blue-600 underline">
                登录
              </Link>{' '}
              查看支持者控制台。
            </>
          ) : (
            <>
              Please{' '}
              <Link href="/account" className="text-blue-600 underline">
                sign in
              </Link>{' '}
              to view your supporter dashboard.
            </>
          )}
        </p>
      </div>
    );
  }

  if (profile.role !== 'supporter') {
    return (
      <div className="p-6 text-center">
        {isChinese ? '您没有支持者权限。' : 'You do not have supporter access.'}
      </div>
    );
  }

  if (!slug || !supporterData) {
    return (
      <div className="p-6 text-center">
        {isChinese
          ? '未找到关联的支持者数据。'
          : 'No supporter record associated with this account.'}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isChinese ? '支持者控制台' : 'Supporter Dashboard'}
      </h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{supporterData.name}</h2>
          {supporterData.description && (
            <p className="text-gray-700 mt-1">{supporterData.description}</p>
          )}
        </div>

        {supporterData.address && (
          <p>
            <strong>{isChinese ? '地址：' : 'Address:'}</strong> {supporterData.address}
          </p>
        )}
        {supporterData.phone && (
          <p>
            <strong>{isChinese ? '电话：' : 'Phone:'}</strong> {supporterData.phone}
          </p>
        )}
        {supporterData.website && (
          <p>
            <strong>{isChinese ? '网站：' : 'Website:'}</strong>{' '}
            <a href={supporterData.website} target="_blank" className="text-blue-600 underline">
              {supporterData.website}
            </a>
          </p>
        )}
      </div>

      <div className="mt-6">
        <Link href="/account" className="text-blue-600 underline">
          {isChinese ? '返回账户' : 'Back to Account'}
        </Link>
      </div>
    </div>
  );
}