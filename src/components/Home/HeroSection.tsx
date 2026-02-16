import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

const HeroSection = () => {
  return (
    <section className="py-10 md:py-28">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-5xl mt-6 md:mt-0 sm:mt-0 lg:mt-0 md:text-7xl sm:text-6xl lg:text-8xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Save Smarter
            </span>
            <br />
            Together with KOSH
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
        Your hub for collaborative savings — build goals, track progress, and grow together.
        </p>
        <div className="mt-10 flex justify-center gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer">
          <Link href={'/register'}>Get Started</Link>
        </button>
        
        <button className="border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer">
          <Link href={'/features'}>Learn More</Link>
        </button>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
