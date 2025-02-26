import { romanize } from '@romanize/korean';

const renderPronunciation = (item, language) => {
    if(!item.reading && language !== 'ko') return null;
    try {
        switch (language) {
            case 'zh':
                return item.reading;
            case 'ja':
                return item.reading;
            case 'ko':
                return romanize(item.text);
            default:
                return null;
        }
    } catch (error) {
        console.error('Error rendering pronunciation:', error);
        return null;
    }
}

export default renderPronunciation;