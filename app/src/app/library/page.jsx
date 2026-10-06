'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Library from '@/components/library/Library';

function LibraryWithTab() {
  const searchParams = useSearchParams();
  return <Library initialTab={searchParams.get('tab') || 'history'} />;
}

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryWithTab />
    </Suspense>
  );
}
