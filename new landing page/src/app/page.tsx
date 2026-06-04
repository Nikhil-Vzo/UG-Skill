import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';

export default function Home() {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-white overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full">
        <HeroSection />
      </main>
    </div>
  );
}
