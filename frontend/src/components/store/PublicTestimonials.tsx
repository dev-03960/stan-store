import React, { useEffect, useState } from 'react';
import { getTestimonials, type Testimonial } from '../../lib/api/products';
import { Star } from 'lucide-react';

interface PublicTestimonialsProps {
    productId: string;
}

export const PublicTestimonials: React.FC<PublicTestimonialsProps> = ({ productId }) => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        getTestimonials(productId).then(data => {
            if (mounted) {
                setTestimonials(data);
                setLoading(false);
            }
        }).catch(err => {
            console.error(err);
            if (mounted) setLoading(false);
        });
        return () => { mounted = false; };
    }, [productId]);

    if (loading || testimonials.length === 0) return null;

    return (
        <div
            className="mt-4 mb-8 backdrop-blur-sm rounded-xl p-5 border shadow-sm"
            style={{
                backgroundColor: 'var(--theme-surface)',
                borderColor: 'var(--theme-border)',
                opacity: 0.9
            }}
        >
            <h4
                className="text-sm font-bold mb-4 flex items-center gap-2"
                style={{ color: 'var(--theme-text-primary)' }}
            >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                What customers say
            </h4>

            <div className="space-y-4">
                {testimonials.map((t) => (
                    <div
                        key={t.id}
                        className="flex gap-3 items-start p-3 rounded-lg shadow-sm border"
                        style={{
                            backgroundColor: 'var(--theme-bg)',
                            borderColor: 'var(--theme-border)',
                            opacity: 0.8
                        }}
                    >
                        {t.avatar_url ? (
                            <img src={t.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-full font-bold flex items-center justify-center shrink-0"
                                style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-button-text, #fff)' }}
                            >
                                {t.customer_name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className="font-semibold text-sm"
                                    style={{ color: 'var(--theme-text-primary)' }}
                                >
                                    {t.customer_name}
                                </span>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                                    ))}
                                </div>
                            </div>
                            <p
                                className="text-sm leading-relaxed italic opacity-80"
                                style={{ color: 'var(--theme-text-secondary)' }}
                            >
                                "{t.text}"
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
