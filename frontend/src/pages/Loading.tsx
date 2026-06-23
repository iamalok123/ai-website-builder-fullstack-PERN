import { Loader2Icon } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


const Loading = () => {
    const navigate = useNavigate();
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/');
        }, 4000);
        return () => clearTimeout(timer);
    }, [navigate]);
    
    return (
      <div className='h-screen flex flex-col'>
        <div className='flex flex-col items-center justify-center flex-1 gap-3'>
            <Loader2Icon className="animate-spin size-7 text-indigo-200" />
            <p className="text-sm text-gray-400">Confirming your payment...</p>
        </div>
      </div>
  )
}

export default Loading