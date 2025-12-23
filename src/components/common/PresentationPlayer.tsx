
import React, { useEffect, useState } from 'react';
import { Presentation } from '../../types';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import { getBlobUrl, cacheUrl } from '../../services/offlineCache';
import { useData } from '../../contexts/DataContext';
import { useI18n } from '../../contexts/I18nContext';

interface PresentationPlayerProps {
    presentation: Presentation;
}

const PresentationPlayer: React.FC<PresentationPlayerProps> = ({ presentation }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slideSrcs, setSlideSrcs] = useState<string[]>(presentation.slides || []);
    const { logEvent } = useData();
    const { t } = useI18n();

    useEffect(() => {
        let active = true;
        Promise.all((presentation.slides || []).map(async s => (await getBlobUrl(s)) || s)).then(srcs => {
            if (active) setSlideSrcs(srcs);
        });
        return () => { active = false; };
    }, [presentation.slides]);
    useEffect(() => {
        logEvent('presentation', 'view', presentation.id, `${presentation.title} slide ${currentSlide + 1}`);
    }, [currentSlide, presentation.id]);

    const nextSlide = () => {
        const slides = presentation.slides || [];
        if (!slides.length) return;
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        const slides = presentation.slides || [];
        if (!slides.length) return;
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    if (!presentation.slides || presentation.slides.length === 0) {
        return <div className="text-white text-center p-4">Sem slides.</div>;
    }

    return (
        <div className="w-full h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden relative">
            <div className="bg-gray-700 p-3 text-center">
                <h3 className="text-xl font-semibold truncate">{presentation.title}</h3>
                <p className="text-sm text-gray-400">
                    {t('presentations.slideCount', { current: currentSlide + 1, total: presentation.slides.length })}
                </p>
            </div>
            <div className="flex-1 relative">
                <img
                    src={slideSrcs[currentSlide]}
                    alt={`Slide ${currentSlide + 1}`}
                    className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4">
                    <button onClick={() => cacheUrl(presentation.slides[currentSlide])} className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-500">{t('admin.saveOffline')}</button>
                </div>
                <div className="absolute inset-0 flex justify-between items-center">
                    <button onClick={prevSlide} className="bg-black bg-opacity-50 text-white p-4 m-4 rounded-full hover:bg-opacity-75">
                        <ArrowLeftIcon className="h-10 w-10" />
                    </button>
                    <button onClick={nextSlide} className="bg-black bg-opacity-50 text-white p-4 m-4 rounded-full hover:bg-opacity-75">
                        <ArrowRightIcon className="h-10 w-10" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PresentationPlayer;
