import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import ProjectPreview from "../components/ProjectPreview";
import type { Project, Version } from "../types";
import api from "@/configs/axios";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

interface PreviewResponse {
    project: {
        current_code: string;
        versions: Version[];
    };
}

const Preview = () => {
    const { projectId, versionId } = useParams();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        if (projectId) {
            api.get<PreviewResponse>(`/api/project/preview/${projectId}`)
                .then(({ data }) => {
                    if (!isMounted) return;

                    const selectedVersion = versionId
                        ? data.project.versions.find((version) => version.id === versionId)
                        : undefined;

                    setCode(selectedVersion?.code || data.project.current_code);
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
    }, [projectId, versionId])

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
