import styles from '@/styles/components/contentpage.module.scss';
import HeaderNav from '@/components/HeaderNav';

function ContentPage({children}) {
    return (
        <div className={styles.contentPage}>
            <HeaderNav />
            {children}
        </div>
    )
}

export default ContentPage;