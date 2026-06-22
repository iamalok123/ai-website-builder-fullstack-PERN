/**
 * Array of AI models to try in order. If the primary model fails or returns
 * empty content, the next model in the list is tried.
 */
export const AI_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-120b:free",
  "poolside/laguna-xs.2:free"
];



/**
 * Comprehensive HTML sanitization and mobile-compatibility fixer.
 * Ensures generated HTML is valid, mobile-friendly, and works across all browsers.
 */
export const sanitizeAndFixHtml = (rawCode: string): string => {
    let code = rawCode;
    const fallbackImageUrl = "https://picsum.photos/800/600?random=101";

    // 1. Strip markdown code fences and leading/trailing whitespace
    code = code.replace(/```[a-z]*\n?/gi, '').replace(/```\s*$/g, '').trim();

    // 2. Remove any text before the HTML document starts
    const htmlStartMatch = code.match(/<!DOCTYPE\s+html|<html/i);
    if (htmlStartMatch && htmlStartMatch.index !== undefined && htmlStartMatch.index > 0) {
        code = code.substring(htmlStartMatch.index);
    }

    // 3. Remove any text after </html>
    const htmlEndIndex = code.lastIndexOf('</html>');
    if (htmlEndIndex !== -1) {
        code = code.substring(0, htmlEndIndex + 7);
    }

    // 4. Ensure DOCTYPE exists
    if (!/<!DOCTYPE\s+html/i.test(code)) {
        code = '<!DOCTYPE html>\n' + code;
    }

    // 5. Ensure <html> tag exists
    if (!/<html[\s>]/i.test(code)) {
        code = code.replace(/(<!DOCTYPE html>)/i, '$1\n<html lang="en">');
        if (!/<\/html>/i.test(code)) code += '\n</html>';
    }

    // 6. Ensure <head> section exists
    if (!/<head[\s>]/i.test(code)) {
        code = code.replace(/<html[^>]*>/i, (m) => m + '\n<head>\n</head>');
    }

    // 7. Ensure <body> section exists
    if (!/<body[\s>]/i.test(code)) {
        code = code.replace(/<\/head>/i, '</head>\n<body>');
        if (!/<\/body>/i.test(code)) {
            code = code.replace(/<\/html>/i, '</body>\n</html>');
        }
    }

    // 8. CRITICAL: Ensure viewport meta tag for mobile responsiveness
    if (!/name=["']viewport["']/i.test(code)) {
        code = code.replace(/<head[^>]*>/i, (m) =>
            m + '\n<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }

    // 9. Ensure charset meta
    if (!/charset/i.test(code)) {
        code = code.replace(/<head[^>]*>/i, (m) => m + '\n<meta charset="UTF-8">');
    }

    // 10. Ensure Tailwind CSS CDN is present
    if (!/tailwindcss|@tailwindcss|tailwind\.min\.css/i.test(code)) {
        code = code.replace(/<\/head>/i,
            '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"><\/script>\n</head>');
    }

    // 11. Inject mobile-safety CSS to prevent common mobile rendering issues
    if (!/overflow-x\s*:\s*hidden/i.test(code)) {
        const mobileSafetyCSS = `<style>
*,*::before,*::after{box-sizing:border-box}
html,body{overflow-x:hidden;max-width:100vw;scroll-behavior:smooth}
img,video,svg{max-width:100%;height:auto}
table{max-width:100%;display:block;overflow-x:auto}
pre,code{white-space:pre-wrap;word-wrap:break-word;max-width:100%}
</style>`;
        code = code.replace(/<\/head>/i, mobileSafetyCSS + '\n</head>');
    }

    // 12. Fix querySelector with Tailwind classes containing slashes (e.g. w-1/2)
    code = code.replace(/document\.querySelector\(['"](\.?[^'"]*\/[^'"]*)['"]\)/g, (_match, selector) => {
        const escaped = selector.replace(/\//g, '\\\\/');
        return `document.querySelector('${escaped}')`;
    });

    // 13. Replace querySelector('.class') patterns with getElementById where possible
    // This improves mobile browser compatibility
    code = code.replace(
        /document\.querySelector\(['"]#([a-zA-Z][\w-]*)["']\)/g,
        'document.getElementById(\'$1\')'
    );

    // 14. Fix fabricated/broken image URLs — replace with picsum placeholders
    code = code.replace(
        /src=["'](https?:\/\/(?!picsum\.photos|cdn\.|fonts\.|unpkg|cdnjs|jsdelivr|img\.icons8|images\.unsplash|placehold|via\.placeholder)[^"']+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^"']*)?)["']/gi,
        () => {
            const randomId = Math.floor(Math.random() * 1000);
            return `src="https://picsum.photos/800/600?random=${randomId}"`;
        }
    );

    // 14b. Replace local/relative generated image paths that will not exist after export/publish.
    code = code.replace(
        /src=["']((?!https?:\/\/|data:|blob:|#)[^"']+\.(?:jpg|jpeg|png|gif|webp|avif|svg)(?:\?[^"']*)?)["']/gi,
        () => {
            const randomId = Math.floor(Math.random() * 1000);
            return `src="https://picsum.photos/800/600?random=${randomId}"`;
        }
    );

    // 15. Ensure all images have loading="lazy" for performance
    code = code.replace(/<img(?![^>]*loading)[^>]*>/gi, (match) =>
        match.replace('<img', '<img loading="lazy"'));

    // 16. Add alt="" to images missing alt attribute for accessibility
    code = code.replace(/<img(?![^>]*alt)[^>]*>/gi, (match) =>
        match.replace('<img', '<img alt="image"'));

    // 16b. Add resilient image attributes for generated previews/downloads.
    code = code.replace(/<img(?![^>]*decoding=)[^>]*>/gi, (match) =>
        match.replace('<img', '<img decoding="async"'));
    code = code.replace(/<img(?![^>]*referrerpolicy=)[^>]*>/gi, (match) =>
        match.replace('<img', '<img referrerpolicy="no-referrer"'));
    code = code.replace(/<img(?![^>]*onerror=)[^>]*>/gi, (match) =>
        match.replace('<img', `<img onerror="this.onerror=null;this.src='${fallbackImageUrl}'"`));

    // 17. Remove problematic SVG elements that break on some mobile browsers
    // Only remove complex SVGs (with paths/polygons), keep simple ones
    code = code.replace(/<svg[^>]*>[\s\S]*?<(path|polygon|circle|rect|line|polyline|ellipse)[\s\S]*?<\/svg>/gi, (match) => {
        // If SVG has more than 500 chars, it's complex — remove it
        if (match.length > 500) return '';
        return match;
    });

    // 18. Fix common JS issues: wrap inline scripts in try-catch for resilience
    code = code.replace(/<script>(?!\s*\/\/\s*external)([\s\S]*?)<\/script>/gi, (fullMatch, scriptContent: string) => {
        // Skip empty scripts or scripts that are just CDN includes
        if (!scriptContent.trim() || fullMatch.includes('src=')) return fullMatch;
        // Skip if already wrapped in try-catch or DOMContentLoaded
        if (scriptContent.includes('try') || scriptContent.includes('DOMContentLoaded')) return fullMatch;

        return `<script>
try {
${scriptContent.trim()}
} catch(e) { console.warn('Script error:', e.message); }
<\/script>`;
    });

    // 19. Remove embedded documents/media that often break on mobile and create security issues.
    code = code.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    code = code.replace(/<(object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '');
    code = code.replace(/<(object|embed)\b[^>]*\/?>/gi, '');

    // 20. Ensure TinyMCE CDN is included if TinyMCE is used
    if (code.includes('tinymce') && !code.includes('cdn.tiny.cloud')) {
        code = code.replace(/<\/body>/i,
            '<script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" referrerpolicy="origin"><\/script>\n</body>');
    }

    return code.trim();
};

/**
 * Public previews should preserve styling but remove generated behavior.
 * The Tailwind browser CDN is allowed because generated pages rely on it for
 * styling; inline and unrelated scripts are stripped before public rendering.
 */
export const sanitizeForPublicPreview = (rawCode: string): string => {
    let code = sanitizeAndFixHtml(rawCode);

    code = code.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (scriptTag) => {
        const srcMatch = scriptTag.match(/\ssrc=["']([^"']+)["']/i);
        const src = srcMatch?.[1] || '';
        const isAllowedTailwindScript = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@4/i.test(src);
        return isAllowedTailwindScript ? scriptTag : '';
    });

    code = code.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    code = code.replace(/javascript:/gi, '');

    return code.trim();
};


