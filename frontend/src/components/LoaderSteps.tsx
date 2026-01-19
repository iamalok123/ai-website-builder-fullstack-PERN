import { CircleIcon, ScanLineIcon, SquareIcon, TriangleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const steps = [
    { icon: ScanLineIcon, label: "Analyzing your request..." },
    { icon: SquareIcon, label: "Generating layout structure..." },
    { icon: TriangleIcon, label: "Assembling UI components..." },
    { icon: CircleIcon, label: "Finalising Your website..." },
]

const STEP_DURATION = 45000

const LoaderSteps = () => {
    const [current, setCurrent] = useState(0)
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % steps.length)
        }, STEP_DURATION)
        return () => clearInterval(interval)
    }, [current])
    
    const Icon = steps[current].icon ;

    return (
        <div className='w-full h-full flex flex-col items-center justify-center bg-gray-950 relative overflow-hidden'>
            <div className='absolute inset-0  bg-linear-gradient-to-br from-blue-500/10 via-purple-500/10 to-fuchsia-500/10 blur-3xl animate-pulse'></div>

            <div className='realtive z-10 w-32 h-32 flex items-center justify-center'>
                <div className='absolute inset-0 rounded-full border border-indigo-400 animate-ping opacity-30 ' />
                <div className='absolute inset-4 rounded-full border border-pink-400/20 ' />
                <Icon className='h-8 w-8 text-white opacity-80 animate-bounce' />
            </div>

            {/* Step label - fade using transition only (no invisible start) */}
            <p
                key={current}
                className='m-8 text-lg font-light text-white/90 tracking-wide transition-all duration-700 ease-in-out opacity-100'
            >
                {steps[current].label}
            </p>

            <p className='text-xs text-gray-400 mt-2 transition-opacity duration-700 ease-in-out opacity-100'>
                This may take around 2-3 minutes... 
            </p>
        </div>
    )
}

export default LoaderSteps