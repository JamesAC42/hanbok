import styles from '@/styles/components/typing/mobileoverlay.module.scss';
import Dashboard from '@/components/Dashboard';
import { MaterialSymbolsKeyboard } from '@/components/icons/Keyboard';

export default function MobileOverlay() {
    return (
        <Dashboard>
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <div className={styles.icon}>
                        <MaterialSymbolsKeyboard />
                    </div>
                    <h1 className={styles.title}>Desktop Only</h1>
                    <p className={styles.message}>
                        Korean typing practice is designed for desktop use only. 
                        Please visit this page on a desktop or laptop computer to access the full typing practice experience.
                    </p>
                    <div className={styles.features}>
                        <h3>What you'll get on desktop:</h3>
                        <ul>
                            <li>Interactive Korean keyboard display</li>
                            <li>Multiple practice modes (row drilling, random characters, paragraphs)</li>
                            <li>Real-time typing speed and accuracy tracking</li>
                            <li>Progressive difficulty levels</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
} 