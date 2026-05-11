import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import ProjectPreview from "../components/ProjectPreview";
import type { Project } from "../types";
import api from "@/configs/axios";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

const View = () => {
    const { projectId } = useParams();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        if (projectId) {
            api.get<{ code: string }>(`/api/project/published/${projectId}`)
                .then(({ data }) => {
                    if (isMounted) {
                        setCode(data.code);
                    }
                })
                .catch((error) => {
                    toast.error(getErrorMessage(error));
                })
                .finally(() => {
                    if (isMounted) {
                        setLoading(false);
                    }
                });
        }

        return () => {
            isMounted = false;
        };
    }, [projectId])

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

export default View
