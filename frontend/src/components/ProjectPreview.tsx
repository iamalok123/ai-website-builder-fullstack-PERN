import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import type { Project } from "../types";
import { iframeScript } from "../assets/assets";
import EditorPanel from "./EditorPanel";
import LoaderSteps from "./LoaderSteps";
import { Loader2Icon, RefreshCcwIcon } from "lucide-react";

type SelectedElement = {
    tagName: string;
    className: string;
    text: string;
    styles: {
        padding: string;
        margin: string;
        backgroundColor: string;
        color: string;
        fontSize: string;
    };
}

export interface ProjectPreviewProps {
    project: Project | null;
    isGenerating: boolean;
    device?: 'phone' | 'tablet' | 'desktop';
    showEditorPanel?: boolean;
    onRetryGeneration?: () => void;
    isRetrying?: boolean;
}

export interface ProjectPreviewRef {
    getCode: () => string | undefined;
}

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>(({ project, isGenerating, device = 'desktop', showEditorPanel = true, onRetryGeneration, isRetrying = false }, ref) => {

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

    useImperativeHandle(ref, () => ({
        getCode: () => {
            const doc = iframeRef.current?.contentWindow?.document;
            if (!doc) {
                return undefined;
            }

            // Clone the document to avoid modifying the live iframe
            const clonedDoc = doc.cloneNode(true) as Document;

            // 1. Remove Our selection class / attributes / outline from all elements in the clone
            clonedDoc.querySelectorAll('.ai-selected-element,[data-ai-selected]').forEach(
                (el) => {
                    el.classList.remove('ai-selected-element');
                    el.removeAttribute('data-ai-selected');
                    (el as HTMLElement).style.outline = '';
                }
            );

            // 2. Remove injected script and style from the cloned document
            const previewStyle = clonedDoc.getElementById('ai-preview-style');
            if (previewStyle) {
                previewStyle.remove();
            }
            const previewScript = clonedDoc.getElementById('ai-preview-script');
            if (previewScript) {
                previewScript.remove();
            }

            // 3. Serialize clean HTML with DOCTYPE
            const html = '<!DOCTYPE html>\n' + clonedDoc.documentElement.outerHTML;
            return html;
        }
    }))
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'ELEMENT_SELECTED') {
                setSelectedElement(event.data.payload);
            } else if (event.data.type === 'CLEAR_SELECTION') {
                setSelectedElement(null);
            }
        }
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        }
    }, [])

    const handleUpdate = (updates: Record<string, unknown>) => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_ELEMENT',
                payload: updates
            }, window.location.origin);
        }
    }

    const injectPreview = (html: string) => {
        if (!html) {
            return '';
        }
        if (!showEditorPanel) {
            return html;
        }
        if (html.includes('</body>')) {
            return html.replace('</body>', iframeScript + '</body>');
        } else {
            return html + iframeScript;
        }
    }
    const resolutions = {
        phone: 'w-[375px]',
        tablet: 'w-[768px]',
        desktop: 'w-full',
    }
    const sandboxPermissions = showEditorPanel
        ? "allow-scripts allow-same-origin allow-forms allow-popups"
        : "allow-scripts allow-forms allow-popups";

    return (
        <div className="relative h-full bg-gray-900 flex-1 rounded-xl overflow-hidden max-sm:ml-2">
            {project?.current_code ? (
                <div className="relative h-full">
                    <iframe
                        ref={iframeRef}
                        title={project.name}
                        srcDoc={injectPreview(project.current_code)}
                        className={`max-sm:w-full h-full ${resolutions[device]} mx-auto transition-all`}
                        sandbox={sandboxPermissions}
                    />
                    {showEditorPanel && selectedElement && (
                        <EditorPanel
                            selectedElement={selectedElement}
                            onUpdate={handleUpdate}
                            onClose={
                                () => {
                                    setSelectedElement(null);
                                    if (iframeRef.current?.contentWindow) {
                                        iframeRef.current.contentWindow.postMessage({
                                            type: 'CLEAR_SELECTION_REQUEST'
                                        }, window.location.origin);
                                    }
                                }
                            }
                        />
                    )}
                </div>
            ) : project?.generationStatus === 'failed' ? (
                <div className="flex h-full items-center justify-center p-6 text-center">
                    <div className="max-w-md rounded-lg border border-red-500/40 bg-red-950/40 p-5">
                        <p className="text-sm font-semibold text-red-100">Generation failed</p>
                        <p className="mt-2 text-sm text-red-200">
                            {project.generationError || "The website could not be generated. Your credits were restored, so you can try again."}
                        </p>
                        {onRetryGeneration && (
                            <button
                                disabled={isRetrying}
                                onClick={onRetryGeneration}
                                className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isRetrying ? (
                                    <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                    <RefreshCcwIcon className="size-4" />
                                )}
                                Retry generation
                            </button>
                        )}
                    </div>
                </div>
            ) : isGenerating && (
                <LoaderSteps />
            )}
        </div>
    )
})

export default ProjectPreview
