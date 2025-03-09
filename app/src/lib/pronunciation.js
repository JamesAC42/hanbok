import { romanize } from '@romanize/korean';

const renderPronunciation = (item, language) => {
    if(!item.reading && language !== 'ko' && language !== 'ru') return null;
    try {
        switch (language) {
            case 'zh':
                return item.reading;
            case 'ja':
                return item.reading;
            case 'ko':
                return romanize(item.text);
            case 'ru':
                return item.transliteration;
            default:
                return null;
        }
    } catch (error) {
        console.error('Error rendering pronunciation:', error);
        return null;
    }
}

export default renderPronunciation;