import Link from 'next/link'
import React from 'react'

const LogoComponent = () => {
  return (
    <div className='flex items-center gap-2'>
        <Link href={'/'} className='flex items-center space-x-2'>
            <span className='text-2xl font-bold text-primary'>
                <span className='bg-gradient-to-r from-blue-800 to-blue-500 bg-clip-text text-transparent'>KOSH</span>
            </span>
        </Link>
    </div>
  )
}

export default LogoComponent
