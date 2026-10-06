'use client';
import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
import { useLanguage } from '@/contexts/LanguageContext';

// Old progress links: the reader now shows the passage while it is read, so
// send the learner there.
function ProgressRedirect() {
    const { jobId } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useLanguage();

    useEffect(() => {
        const textId = searchParams.get('textId');
        if (textId) {
            router.replace(`/extended-text/${textId}?job=${jobId}`);
            return undefined;
        }
        const source = new EventSource(`/api/extended-text/progress/${jobId}`);
        source.addEventListener('init', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.textId) {
                    source.close();
                    router.replace(data.status === 'completed' ? `/extended-text/${data.textId}` : `/extended-text/${data.textId}?job=${jobId}`);
                }
            } catch {
                // Ignore malformed events.
            }
        });
        source.addEventListener('completed', (event) => {
            try {
                const data = JSON.parse(event.data);
                source.close();
                if (data.textId) router.replace(`/extended-text/${data.textId}`);
            } catch {
                // Ignore malformed events.
            }
        });
        source.onerror = () => {
            if (source.readyState === EventSource.CLOSED) router.replace('/extended-text');
        };
        return () => source.close();
    }, [jobId, router, searchParams]);

    return (
        <Dashboard>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 1rem' }}>
                <Mascot pose="study" size={96} motion="bob" />
                <p>{t('extended_text.loading')}</p>
            </div>
        </Dashboard>
    );
}

export default function ProgressPage() {
    return (
        <Suspense fallback={null}>
            <ProgressRedirect />
        </Suspense>
    );
}
