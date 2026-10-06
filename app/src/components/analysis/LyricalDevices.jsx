import styles from '@/styles/components/sentenceanalyzer/lyricaldevices.module.scss';
import { HugeiconsMusicNote02 } from '@/components/icons/MusicNote';

const LyricalDevices = ({analysis}) => {

    if(!analysis.lyrical_devices) {
        return null;
    }

    const lyricalDevices = analysis.lyrical_devices;

    const capitalize = (s) => {
        let str = s.toLowerCase();
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    return (
        <div className={styles.lyricalDevices}>
            {
                lyricalDevices.map((device, index) => (
                    <div key={index} className={styles.lyricalDevice}>
                        <div className={styles.lyricalDeviceIcon} aria-hidden="true">
                            <HugeiconsMusicNote02 />
                        </div>
                        <div className={styles.lyricalDeviceText}>
                            <h3>{capitalize(device.type)}</h3>
                            <p>{device.explanation}</p>
                            {device.effect && <p className={styles.effect}>{device.effect}</p>}
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default LyricalDevices;