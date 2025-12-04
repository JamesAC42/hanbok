'use client';
import styles from '@/styles/components/sentenceanalyzer/recentlyanalyzed.module.scss';
import { BasilEyeSolid } from '@/components/icons/Eye';
import { useLanguage } from '@/contexts/LanguageContext';

const RecentlyAnalyzed = () => {
    const { t } = useLanguage();

    const mockData = [
        {
            id: 1,
            sentence: "이 영화는 정말 재미있었습니다.",
            translation: "This movie was really interesting.",
            user: "User23",
            views: 1,
            color: "#3b82f6", // Blue
            avatarColor: "#bfdbfe"
        },
        {
            id: 2,
            sentence: "저는 한국 음식을 좋아합니다.",
            translation: "I like Korean food.",
            user: "User456",
            views: 2,
            color: "#10b981", // Green
            avatarColor: "#a7f3d0"
        },
        {
            id: 3,
            sentence: "내일 날씨가 좋을 것 같아요.",
            translation: "I think the weather will be good tomorrow.",
            user: "User789",
            views: 3,
            color: "#a855f7", // Purple
            avatarColor: "#e9d5ff"
        },
        {
            id: 4,
            sentence: "이 책은 너무 어려워요.",
            translation: "This book is too difficult.",
            user: "UserABC",
            views: 4,
            color: "#ef4444", // Red
            avatarColor: "#fecaca"
        },
        {
            id: 5,
            sentence: "커피를 마시고 싶어요.",
            translation: "I want to drink coffee.",
            user: "UserXYZ",
            views: 3,
            color: "#f59e0b", // Orange
            avatarColor: "#fde68a"
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.backdrop}></div>
            <div className={styles.content}>
                <h2 className={styles.title}>{t('analysis.recentlyAnalyzed', 'Recently Analyzed by the Community')}</h2>
                <div className={styles.cardList}>
                    {mockData.map((item) => (
                        <div 
                            key={item.id} 
                            className={styles.card}
                            style={{ borderTopColor: item.color }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.userInfo}>
                                    <div className={styles.avatar} style={{ backgroundColor: item.avatarColor }}>
                                        <img 
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user}`} 
                                            alt={item.user} 
                                        />
                                    </div>
                                    <span className={styles.username}>{item.user}</span>
                                </div>
                                <div className={styles.views}>
                                    <BasilEyeSolid />
                                    <span>{item.views}</span>
                                </div>
                            </div>
                            
                            <div className={styles.sentence}>
                                {item.sentence}
                            </div>
                            
                            <div className={styles.translation}>
                                ({item.translation})
                            </div>
                            
                            <div className={styles.cardFooter}>
                                <button className={styles.analyzeBtn}>
                                    {t('analysis.analyzeBtn', 'Analyse')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecentlyAnalyzed;

