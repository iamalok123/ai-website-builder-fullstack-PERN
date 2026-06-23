import logo from './logo.svg';

export const assets = {
    logo,
};

export const appPlans = [
    {
        id: 'basic',
        name: 'Basic',
        price: '$5',
        credits: 100,
        description: 'Start now and scale up as you grow.',
        features: ['Up to 20 creations', 'Limited revisions', 'AI website generation', 'Version history', 'Publish and download',],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$19',
        credits: 400,
        description: 'Add credits to create more projects',
        features: ['Up to 80 creations', 'Extended revisions', 'AI website generation', 'Version history', 'Publish and download',],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '$49',
        credits: 1000,
        description: 'Add credits to create more projects',
        features: ['Up to 200 creations', 'Increased revisions', 'AI website generation', 'Version history', 'Publish and download',],
    }
]


export const iframeScript = `
        <style id="ai-preview-style">
        .ai-selected-element {
            outline: 2px solid #6366f1 !important;
        }
        </style>
        <script id="ai-preview-script">
        (function () {
            // If this HTML is opened directly (not in an iframe), do nothing.
            if (window === window.parent) {
            return;
            }

            let selectedElement = null;

            function clearSelected() {
            if (selectedElement) {
                selectedElement.classList.remove('ai-selected-element');
                selectedElement.removeAttribute('data-ai-selected');
                selectedElement.style.outline = '';
                selectedElement = null;
            }
            }

            // ─── CAPTURE PHASE listener (3rd arg = true) ────────────────────────────
            // Must run BEFORE any generated-website JS (onclick, addEventListener on
            // elements/document in bubble phase). Using capture guarantees we intercept
            // the event at the top of the DOM tree on its way DOWN — before it reaches
            // the target element and before any bubble-phase handlers fire.
            document.addEventListener('click', function (e) {
            // Determine if the click is on a same-page hash anchor (#section).
            // These are safe — they only scroll within the iframe, never navigate away.
            var anchor = e.target && e.target.closest ? e.target.closest('a') : null;
            var href = anchor ? (anchor.getAttribute('href') || '') : '';
            var isSamePageHash = anchor && href.startsWith('#') && href.length > 1;

            if (isSamePageHash) {
                // Let the browser handle smooth-scroll hash navigation inside the iframe.
                // Do NOT stopPropagation so the site's own scroll JS can also run.
                return;
            }

            // For everything else (buttons, forms, external links, empty hrefs, JS links)
            // prevent the default action AND stop ALL other handlers from running.
            // This keeps the iframe from reloading or navigating away.
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation(); // kills sibling listeners on the same element too

            clearSelected();

            var target = e.target;

            // Don't select body or html
            if (!target || target.tagName === 'BODY' || target.tagName === 'HTML') {
                window.parent.postMessage({ type: 'CLEAR_SELECTION' }, '*');
                return;
            }

            // For SVG child elements (path, circle, rect, line, polygon, polyline, ellipse, g, use, text),
            // select the parent <svg> element instead to avoid SVGAnimatedString serialization issues
            var svgChildTags = ['PATH','CIRCLE','RECT','LINE','POLYGON','POLYLINE','ELLIPSE','G','USE','TEXT','TSPAN','DEFS','CLIPPATH','MASK'];
            if (target.ownerSVGElement || svgChildTags.indexOf(target.tagName) !== -1) {
                // Walk up to the nearest <svg> or non-SVG parent
                while (target && target.tagName !== 'SVG' && target.tagName !== 'BODY') {
                    target = target.parentElement;
                }
                if (!target || target.tagName === 'BODY') return;
            }

            selectedElement = target;
            selectedElement.classList.add('ai-selected-element');
            selectedElement.setAttribute('data-ai-selected', 'true');

            var computedStyle = window.getComputedStyle(selectedElement);

            // Safely get className as string (SVG elements return SVGAnimatedString)
            var classStr = '';
            try {
                classStr = typeof selectedElement.className === 'string'
                    ? selectedElement.className
                    : (selectedElement.className.baseVal || selectedElement.getAttribute('class') || '');
            } catch(err) {
                classStr = selectedElement.getAttribute('class') || '';
            }

            // Convert oklch/rgb colors to hex for color input compatibility
            function colorToHex(color) {
                if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return '#000000';
                try {
                    var temp = document.createElement('div');
                    temp.style.color = color;
                    document.body.appendChild(temp);
                    var computed = window.getComputedStyle(temp).color;
                    document.body.removeChild(temp);
                    var match = computed.match(/rgb[a]?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
                    if (match) {
                        return '#' + [match[1], match[2], match[3]].map(function(x) {
                            return parseInt(x).toString(16).padStart(2, '0');
                        }).join('');
                    }
                } catch(err) {}
                return '#000000';
            }

            window.parent.postMessage({
                type: 'ELEMENT_SELECTED',
                payload: {
                tagName: selectedElement.tagName,
                className: classStr,
                text: selectedElement.innerText || selectedElement.textContent || '',
                styles: {
                    padding: computedStyle.padding,
                    margin: computedStyle.margin,
                    backgroundColor: colorToHex(computedStyle.backgroundColor),
                    color: colorToHex(computedStyle.color),
                    fontSize: computedStyle.fontSize
                }
                }
            }, '*');
            }, true); // <-- capture phase: fires BEFORE any generated-website JS handlers

            window.addEventListener('message', function (event) {
            if (event.data.type === 'UPDATE_ELEMENT' && selectedElement) {
                const updates = event.data.payload;

                if (updates.className !== undefined) {
                selectedElement.className = updates.className;
                }

                if (updates.text !== undefined) {
                selectedElement.innerText = updates.text;
                }

                if (updates.styles) {
                Object.assign(selectedElement.style, updates.styles);
                }
            } else if (event.data.type === 'CLEAR_SELECTION_REQUEST') {
                clearSelected();

                // extra safety: remove our class + outline from any stray elements
                document.querySelectorAll('.ai-selected-element,[data-ai-selected]').forEach(function (el) {
                el.classList.remove('ai-selected-element');
                el.removeAttribute('data-ai-selected');
                el.style.outline = '';
                });
            }
            });
        })();
        </script>
`;
