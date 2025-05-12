import styles from "@/styles/components/abouthome.module.scss";
import Image from "next/image";
import { useLanguage } from '@/contexts/LanguageContext';

import TestimonialCard from "@/components/TestimonialCard";

const testimonials = [
    {
        text: "I loveeee this site!! the translations are super helpful and has boosted my understanding of Korean sentence structure and grammar!",
        name: "W映月"
    },
    {
        text: "Incredibly helpful when learning Korean, helps me a lot to understand which part of the sentence comes next!",
        name: "Alex Crossan"
    },
    {
        text: "The UI is clean and clear, and the explanations are succinct and understandable.",
        name: "Daniel Sanchez"
    },
    {
        text: "I was amazed when I discovered this site. I have no words, really great site",
        name: "Luigi Cozzolino"
    },
    {
        text: "Wow. really great, I will definitely try more sentences. it's exactly what a a Chinese learner would need",
        name: "foxitt 22"
    },
    {
        text: "I use this tool for Chinese, it is very helpful to understand how sentences are built. I really like the ease of use and all the information it provides.",
        name: "Sergio Hernández González"
    },
    {
        text: "너무 좋다",
        name: "Sung Hyo Park"
    },
    {
        text: "I just started to use this website and it very helpful to understand Korean. I like it how it explains word by word and how the words are used.",
        name: "hppy"
    },
    {
        text: "It's great! I really like the grammar explanations.",
        name: "Just Add Pepper"
    },
    {
        text: "Wow, this is incredible. I don't know how something like this even gets made. This will be my new go-to over AI LLMs for sure!",
        name: "/u/Kiolvor"
    },
    {
        text: "Oh my god! It's exactly what I need!! I'm a highly visual person and the interface is so pretty. The way it is right now is pretty much what I need for my language journey.",
        name: "/u/FuriaDC"
    },
    {
        text: "와 이거 진짜 대박하다 감사합니다😭",
        name: "/u/Sseyh"
    },
    {
        text: "OMG!!!!! Thank you so, so, soooo much!!!!! Will be using your site from now on, and I'm sure it's going to help me so much!!!!!!",
        name: "/u/Excellent-Sugar-7705"
    },
    {
        text: "This is absolutely amazing!",
        name: "/u/New-Dragonfruit-1835"
    },
    {
        text: "I don't usually write post or reply on reddit but I just had to tell you that this is such an amazing website and by far the korean best translation tool I ever came across. Thank you so much for your work.",
        name: "/u/Brief_Brush_8680"
    },
    {
        text: "This is such an insanely useful tool. Especially that you can see the vocabulary listed at the end. I will probably use this daily from now on haha.",
        name: "/u/tatamigalaxy_"
    },
    {
        text: "this is A MA ZING!!!",
        name: "/u/Puzzled-Effort-4125"
    },
    {
        text: "I use your tool nearly everyday and honestly I can't thank you enough!!!",
        name: "/u/Alternative-Part-436"
    },
    {
        text: "Absolutely love it!",
        name: "/u/Late_Bag_4044"
    },
]

import { IcBaselinePerson } from "@/components/icons/Profile";

const AboutHome = () => {
    const { t } = useLanguage();
    return (
        <div className={styles.aboutHome}>

            <h1>{t('home.about.exampleBreakdown')}</h1>
            <div className={styles.mainScreenshot}>
                <Image src="/images/screenshots/example_sentence.png" alt="main screenshot" width={1291} height={965} />
            </div>

            <h1>{t('home.about.features')}</h1>

            <h3>{t('home.about.breakdownHeader')}</h3>
            <p>{t('home.about.breakdownParagraph1')}</p>
            <p>{t('home.about.breakdownParagraph2')}</p>
            <div className={styles.videoContainer}>
                <video 
                    controls
                    width="100%"
                    autoPlay={false}
                    playsInline
                    >
                <source 
                    src="/videos/demo-sentence.webm" 
                    type="video/webm"
                />
                Your browser does not support the video tag.
                </video>
            </div>

            <h3>{t('home.about.imageToTextHeader')}</h3>
            <p>{t('home.about.imageToTextParagraph')}</p>
            <div className={styles.videoContainer}>
                <video 
                    controls
                    width="100%"
                    autoPlay={false}
                    playsInline
                    >
                <source 
                    src="/videos/demo-image.webm" 
                    type="video/webm"
                />
                Your browser does not support the video tag.
                </video>
            </div>

            <h3>{t('home.about.flashcardsHeader')}</h3>
            <p>{t('home.about.flashcardsParagraph')}</p>
            <div className={styles.videoContainer}>
                <video 
                    controls
                    width="100%"
                    autoPlay={false}
                    playsInline
                    >
                <source 
                    src="/videos/demo-flashcards.webm" 
                    type="video/webm"
                />
                Your browser does not support the video tag.
                </video>
            </div>
            
            <h3>{t('home.about.multiLanguageHeader')}</h3>
            <p>{t('home.about.multiLanguageParagraph')}</p>

            <TestimonialCard 
                quote="너무 좋다" 
                author="Sung Hyo Park"/>
            <TestimonialCard 
                quote="I loveeee this site!! the translations are super helpful!" 
                author="W映月"/>
            <TestimonialCard 
                quote="This is such an insanely useful tool. Especially that you can see the vocabulary listed at the end." 
                author="u/tatamigalaxy_"/>

            <h3>{t('home.about.mobileSupportHeader')}</h3>
            <p>{t('home.about.mobileSupportParagraph')}</p>

            <h1>{t('home.about.whatUsersSayHeader')}</h1>
            <div className={styles.testimonials}>
                <div className={styles.testimonialRow}>
                    {[...testimonials.slice(0, Math.ceil(testimonials.length/2)), 
                      ...testimonials.slice(0, Math.ceil(testimonials.length/2))].map((testimonial, index) => (
                        <div 
                            key={index} 
                            className={styles.testimonial}
                        >
                            <p className={styles.testimonialContent}>{testimonial.text}</p>
                            <div className={styles.testimonialAuthor}>
                                <div className={styles.authorIcon}>
                                    <IcBaselinePerson />
                                </div>
                                <p>{testimonial.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.testimonialRow}>
                    {[...testimonials.slice(Math.ceil(testimonials.length/2)), 
                      ...testimonials.slice(Math.ceil(testimonials.length/2))].map((testimonial, index) => (
                        <div 
                            key={index} 
                            className={styles.testimonial}
                        >
                            <p className={styles.testimonialContent}>{testimonial.text}</p>
                            <div className={styles.testimonialAuthor}>
                                <div className={styles.authorIcon}>
                                    <IcBaselinePerson />
                                </div>
                                <p>{testimonial.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.callToAction}>
                <h2>{t('home.about.callToActionHeader')}</h2>
                <p>{t('home.about.callToAction')}</p>
            </div>
        </div>
    )
}

export default AboutHome;