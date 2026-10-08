// The two Speak characters: art folder, which side of the scene they stand
// on (each faces the middle), and their dialogue color from the lesson videos.
export const CHARACTERS = {
    horang: {
        id: 'horang',
        name: 'Horang',
        side: 'right',
        color: '#FF8A00',
        soft: '#FFF1DD',
        moods: ['neutral', 'happy', 'amused', 'encouraging', 'explaining', 'thinking', 'shocked', 'exasperated', 'apologetic', 'proud', 'smug', 'serious'],
        rest: 'happy',
        celebrate: 'proud',
        face: 57, // head's center, % across the art, for round avatars
        tagline: 'Your tutor. Warm, cheeky, a little dramatic.',
    },
    sora: {
        id: 'sora',
        name: 'Sora',
        side: 'left',
        color: '#3D64E8',
        soft: '#EAF0FF',
        moods: ['neutral', 'happy', 'excited', 'surprised', 'thinking', 'confused', 'determined', 'embarrassed', 'scheming', 'worried', 'annoyed', 'disappointed'],
        rest: 'happy',
        celebrate: 'excited',
        face: 38,
        tagline: 'Your friend from Seoul. K-pop, street food, big reactions.',
    },
};

export const characterOf = (id) => CHARACTERS[id] || CHARACTERS.horang;

export const spriteSrc = (character, mood, talking) => {
    const ch = characterOf(character);
    const m = ch.moods.includes(mood) ? mood : ch.rest;
    return `/images/speak/${ch.id}/${m}${talking ? '_talk' : ''}.webp`;
};

export const ASSISTS = [
    { id: 'guided', label: 'Guided', blurb: 'Tells you exactly what to say next and shows it on screen.' },
    { id: 'hints', label: 'Hints', blurb: 'Gives you a nudge or the first word, so you work it out.' },
    { id: 'immersion', label: 'Immersion', blurb: 'Stays in the language you are learning as much as possible.' },
];

export const defaultAssist = (level) => (level === 'advanced' ? 'immersion' : level === 'intermediate' ? 'hints' : 'guided');
