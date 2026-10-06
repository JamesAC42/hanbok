'use client';
import ContentPage from '@/components/ContentPage';
import Dashboard from '@/components/Dashboard';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/pages/learn.module.scss';

// Signed-in readers get the app shell; visitors keep the public site header.
// While auth loads, the article still renders (it is what search engines read),
// just without either shell around it.
const LearnShell = ({ children }) => {
    const { user, loading } = useAuth();
    const isPublic = !loading && !user;
    const body = <div className={`${styles.learnPage} ${isPublic ? styles.publicPage : ''}`}>{children}</div>;

    if (loading) return <div className={styles.blankShell}>{body}</div>;
    if (user) return <Dashboard>{body}</Dashboard>;
    return (
        <ContentPage>
            {body}
            <Footer />
        </ContentPage>
    );
};

export default LearnShell;
