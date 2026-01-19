import { useEffect, useState } from "react";
import { dummyProjects } from "../assets/assets";
import { useParams } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import ProjectPreview from "../components/ProjectPreview";
import type { Project } from "../types";

const Preview = () => {
    const { projectId } = useParams();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchCode = async () => {
        setTimeout(() => {
            const project = dummyProjects.find(project => project.id === projectId)?.current_code;
            if (project) {
                setCode(project);
                setLoading(false);
            }
        }, 2000);
    }

    useEffect(() => {
        fetchCode();
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2Icon className="animate-spin size-7 text-indigo-200" />
            </div>
        )
    }

    return (
        <div className="h-screen">
            {code && <ProjectPreview
                project={{ current_code: code } as Project}
                isGenerating={false}
                showEditorPanel={false}
            />
            }
        </div>
    )
}

export default Preview;