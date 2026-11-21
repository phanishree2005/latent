'use client';

import React, { useState } from 'react';
import { EPISODES } from '@/data/products';
import { Play, X, ExternalLink } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function EpisodesGrid() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const { playSound } = useCart();

  const openVideo = (videoId: string) => {
    playSound('click');
    setActiveVideo(videoId);
  };

  const closeVideo = () => {
    playSound('click');
    setActiveVideo(null);
  };

  return (
    <section id="episodes" className="w-full bg-[#08090b] text-white py-20 px-4 md:px-8 border-b border-borderDark">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 border-b border-borderDark pb-6">
          <div>
            <div className="flex items-center gap-2 text-crimson font-mono text-xs font-bold tracking-widest uppercase mb-1">
              <span className="w-2 h-2 bg-crimson" />
              <span>THE ARCHIVES</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight">
              REVISION KAR LO
            </h2>
            <p className="text-white/60 text-sm font-mono mt-1">
              Stream every episode of India&apos;s Got Latent Season 2.
            </p>
          </div>

          <a
            href="https://www.youtube.com/@samayraina"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface hover:bg-white hover:text-black border border-borderDark font-mono text-xs uppercase tracking-wider transition-colors"
          >
            <span>SUBSCRIBE TO CHANNEL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EPISODES.map((ep) => (
            <div
              key={ep.id}
              className="group bg-surface border border-borderDark hover:border-white/50 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => openVideo(ep.videoId)}
                className="relative aspect-video overflow-hidden cursor-pointer bg-black"
              >
                <img
                  src={ep.thumbnail}
                  alt={ep.title}
                  className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-crimson/90 group-hover:bg-crimson group-hover:scale-110 flex items-center justify-center text-white transition-all shadow-xl">
                    <Play className="w-6 h-6 fill-white translate-x-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 font-mono text-[11px] text-white">
                  {ep.duration}
                </div>

                <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 font-mono text-xs font-bold text-accentYellow border border-white/10 uppercase">
                  EPISODE #{ep.id}
                </div>
              </div>

              {/* Episode Title & Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm md:text-base font-bold text-white group-hover:text-accentYellow transition-colors line-clamp-2">
                    {ep.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-borderDark/60 flex items-center justify-between font-mono text-xs">
                  <button
                    onClick={() => openVideo(ep.videoId)}
                    className="text-white/60 hover:text-white uppercase font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>[ PLAY EPISODE ]</span>
                  </button>
                  <a
                    href={ep.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-crimson transition-colors"
                  >
                    YouTube ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-black border border-borderDark shadow-2xl overflow-hidden aspect-video">
            <button
              onClick={closeVideo}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/80 text-white hover:bg-crimson flex items-center justify-center transition-colors"
              aria-label="Close video player"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </section>
  );
}
