import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface EditorPanelProps {
    selectedElement: {
        tagName: string;
        className: string;
        text: string;
        styles: {
            padding: string;
            margin: string;
            backgroundColor: string;
            color: string;
            fontSize: string;
        }
    } | null;
    onUpdate: (updates: any) => void;
    onClose: () => void;
}

const EditorPanel = ({ selectedElement, onUpdate, onClose }: EditorPanelProps) => {
    const [values, setValues] = useState(selectedElement);

    useEffect(() => {
        setValues(selectedElement);
    }, [selectedElement]);

    if (!selectedElement || !values) {
        return null;
    }

    const handleChange = (field: string, value: string) => {
        if (!values) return;
        const newValues = { ...values, [field]: value };
        if (field in values.styles) {
            newValues.styles = { ...values.styles, [field]: value };
        }
        setValues(newValues);
        onUpdate({ [field]: value });
    };

    const handleStyleChange = (styleName: string, value: string) => {
        if (!values) return;
        const newStyles = { ...values.styles, [styleName]: value };
        setValues({ ...values, styles: newStyles });
        onUpdate({ styles: { [styleName]: value } });
    };


    return (
        <div className="absolute top-2 right-2 w-72 max-h-[85vh] overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                    Edit Element
                </h3>
                <button className="p-1 hover:bg-gray-100 rounded-full" onClick={onClose}>
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <div className="text-black space-y-2">
                {/* Text Content */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Text Content</label>
                    <textarea
                        value={values.text}
                        onChange={(e) => handleChange('text', e.target.value)}
                        className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-14"
                    />
                </div>

                {/* Class Name */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Class Name</label>
                    <input
                        type="text"
                        value={values.className || ''}
                        onChange={(e) => handleChange('className', e.target.value)}
                        className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                </div>

                {/* Padding & Margin */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Padding</label>
                        <input
                            type="text"
                            value={values.styles.padding}
                            onChange={(e) => handleStyleChange('padding', e.target.value)}
                            className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Margin</label>
                        <input
                            type="text"
                            value={values.styles.margin}
                            onChange={(e) => handleStyleChange('margin', e.target.value)}
                            className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* Font Size */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Font Size</label>
                    <input
                        type="text"
                        value={values.styles.fontSize}
                        onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                        className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Background</label>
                        <div className="flex items-center gap-1.5 border border-gray-300 rounded p-1">
                            <input
                                type="color"
                                value={values.styles.backgroundColor === 'rgba(0,0,0,0)' ? '#ffffff' : values.styles.backgroundColor}
                                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                className="h-5 w-5 cursor-pointer rounded"
                            />
                            <span className="text-[10px] text-gray-600 truncate flex-1">
                                {values.styles.backgroundColor}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Text Color</label>
                        <div className="flex items-center gap-1.5 border border-gray-300 rounded p-1">
                            <input
                                type="color"
                                value={values.styles.color}
                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                className="h-5 w-5 cursor-pointer rounded"
                            />
                            <span className="text-[10px] text-gray-600 truncate flex-1">
                                {values.styles.color}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditorPanel