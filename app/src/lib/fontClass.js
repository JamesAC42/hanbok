const fontClass = (language) => {
    switch (language) {
        case 'zh':
            return 'chinese';
        case 'ja':
            return 'japanese';
        case 'ko':
            return 'korean';
        default:
            return 'latin';
    }
}

export default fontClass;