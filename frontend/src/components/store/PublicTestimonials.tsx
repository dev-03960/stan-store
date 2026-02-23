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
        <div className="mt-4 mb-8 bg-white/50 backdrop-blur-sm rounded-xl p-5 border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                What customers say
            </h4>

            <div className="space-y-4">
                {testimonials.map((t) => (
                    <div key={t.id} className="flex gap-3 items-start p-3 bg-white rounded-lg shadow-sm border border-slate-50">
                        {t.avatar_url ? (
                            <img src={t.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center shrink-0">
                                {t.customer_name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-900 text-sm">{t.customer_name}</span>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed italic">"{t.text}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
