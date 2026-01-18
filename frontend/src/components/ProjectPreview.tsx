import { forwardRef, useRef } from "react"
import type { Project } from "../types";
import { iframeScript } from "../assets/assets";

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
                </div>
            ) : isGenerating && (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-gray-400 text-sm">
                        <div>Loading</div>
                    </div>
                </div>
            )}
        </div>
    )
})

export default ProjectPreview