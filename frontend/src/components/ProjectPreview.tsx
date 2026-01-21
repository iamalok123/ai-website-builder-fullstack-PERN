import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import type { Project } from "../types";
import { iframeScript } from "../assets/assets";
import EditorPanel from "./EditorPanel";
import LoaderSteps from "./LoaderSteps";

export interface ProjectPreviewProps {
    project: Project | null;
    isGenerating: boolean;
    device?: 'phone' | 'tablet' | 'desktop';
    showEditorPanel?: boolean;
}

export interface ProjectPreviewRef {
    getCode: () => string | undefined;
}

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>(({ project, isGenerating, device = 'desktop', showEditorPanel = true }, ref) => {

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [selectedElement, setSelectedElement] = useState<any>(null);

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

    const handleUpdate = (updates: any) => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_ELEMENT',
                payload: updates
            }, '*');
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

    return (
        <div className="relative h-full bg-gray-900 flex-1 rounded-xl overflow-hidden max-sm:ml-2">
            {project?.current_code ? (
                <div className="relative h-full">
                    <iframe
                        ref={iframeRef}
                        title={project.name}
                        srcDoc={injectPreview(project.current_code)}
                        className={`max-sm:w-full h-full ${resolutions[device]} mx-auto transition-all`}
                        sandbox="allow-scripts allow-same-origin"
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
                                        }, '*');
                                    }
                                }
                            }
                        />
                    )}
                </div>
            ) : isGenerating && (
                <LoaderSteps />
            )}
        </div>
    )
})

export default ProjectPreview