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
    const [errorMessage, setErrorMessage] = useState('');

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
                    const message = getErrorMessage(error);
                    setErrorMessage(message);
                    toast.error(message);
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

    if (errorMessage) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950 p-6 text-center text-white">
                <div className="max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6">
                    <p className="text-lg font-medium">Preview unavailable</p>
                    <p className="mt-2 text-sm text-gray-300">{errorMessage}</p>
                </div>
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
