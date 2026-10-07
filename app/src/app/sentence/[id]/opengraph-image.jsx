import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { getSharedSentence, clip } from '@/lib/share';
import { languageName } from '@/lib/seo';

// The card a shared breakdown link unfurls into: the sentence, its translation
// and the magpie, in Bright Path colors.
export const alt = 'A sentence broken down on Hanbok';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 86400;

const PUBLIC = join(process.cwd(), 'public');
let assets;
const loadAssets = () => {
    assets ??= Promise.all([
        readFile(join(PUBLIC, 'fonts/Noto_Sans_KR/static/NotoSansKR-Bold.ttf')),
        readFile(join(PUBLIC, 'fonts/Montserrat/static/Montserrat-ExtraBold.ttf')),
        readFile(join(PUBLIC, 'fonts/Lilita_One/LilitaOne-Regular.ttf')),
        readFile(join(PUBLIC, 'images/mascot/magpie-wave.png')),
    ]).then(([noto, montserrat, lilita, magpie]) => ({
        fonts: [
            { name: 'Lilita One', data: lilita, weight: 400, style: 'normal' },
            { name: 'Montserrat', data: montserrat, weight: 800, style: 'normal' },
            { name: 'Noto Sans KR', data: noto, weight: 700, style: 'normal' },
        ],
        magpie: `data:image/png;base64,${magpie.toString('base64')}`,
    })).catch((err) => {
        assets = null;
        throw err;
    });
    return assets;
};

// Noto Sans KR has no simplified Chinese glyphs and the site's Chinese fonts are
// variable fonts, which the image renderer can't read. Fetch just the glyphs this
// sentence needs from Google Fonts; if that fails the card still renders.
const loadChineseFont = async (text, traditional) => {
    const family = traditional ? 'Noto Sans TC' : 'Noto Sans SC';
    try {
        const cssUrl = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@700&text=${encodeURIComponent(text)}`;
        const css = await (await fetch(cssUrl, { signal: AbortSignal.timeout(3000) })).text();
        const fontUrl = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
        if (!fontUrl) return null;
        const res = await fetch(fontUrl, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return null;
        return { name: family, data: await res.arrayBuffer(), weight: 700, style: 'normal' };
    } catch (err) {
        console.error('Chinese font fetch for share card failed:', err.message);
        return null;
    }
};

const sentenceSize = (text) => {
    const n = Array.from(text).length;
    if (n <= 14) return 84;
    if (n <= 28) return 68;
    if (n <= 50) return 54;
    return 44;
};

export default async function Image({ params }) {
    const { id } = await params;
    const [sentence, { fonts, magpie }] = await Promise.all([getSharedSentence(id), loadAssets()]);

    const original = clip(sentence?.original || 'Break down any sentence', 90);
    const translation = clip(sentence?.translation || '', 120);
    const language = sentence ? languageName(sentence.originalLanguage) : '';
    const chineseFont = sentence?.originalLanguage?.startsWith('zh')
        ? await loadChineseFont(original, sentence.originalLanguage === 'zh-TW')
        : null;
    const allFonts = chineseFont ? [...fonts, chineseFont] : fonts;

    return new ImageResponse(
        (
            <div style={{ width: '100%', height: '100%', display: 'flex', background: '#3D64E8', padding: 28 }}>
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff',
                    borderRadius: 32, padding: '44px 56px', boxShadow: '0 8px 0 #2645B8',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            display: 'flex', background: '#E2F6F3', color: '#0B8C80', borderRadius: 99,
                            padding: '8px 20px', fontFamily: 'Montserrat', fontSize: 22, letterSpacing: 2,
                        }}>
                            {language ? `${language.toUpperCase()} BREAKDOWN` : 'SENTENCE BREAKDOWN'}
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: 250 }}>
                        <div style={{
                            display: 'flex', fontFamily: chineseFont ? chineseFont.name : 'Noto Sans KR', fontSize: sentenceSize(original),
                            lineHeight: 1.3, color: '#141833',
                        }}>
                            {original}
                        </div>
                        {translation && (
                            <div style={{
                                display: 'flex', marginTop: 22, fontFamily: 'Montserrat, Noto Sans KR', fontSize: 32,
                                lineHeight: 1.35, color: '#5B6080',
                            }}>
                                {translation}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                            <span style={{ fontFamily: 'Lilita One', fontSize: 52, color: '#3D64E8' }}>Hanbok</span>
                            <span style={{ fontFamily: 'Montserrat', fontSize: 24, color: '#8A8FA8' }}>hanbokstudy.com</span>
                        </div>
                        <div style={{
                            display: 'flex', background: '#3D64E8', color: '#ffffff', borderRadius: 14,
                            padding: '12px 26px', fontFamily: 'Montserrat', fontSize: 24, letterSpacing: 1,
                            boxShadow: '0 4px 0 #2645B8',
                        }}>
                            SEE EVERY WORD →
                        </div>
                    </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={magpie} width={240} height={271} style={{ position: 'absolute', right: 70, top: 150 }} alt="" />
            </div>
        ),
        { ...size, fonts: allFonts },
    );
}
