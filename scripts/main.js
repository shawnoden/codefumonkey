document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const rightPanel = document.getElementById('right-panel');
    const closePanelBtn = document.getElementById('close-panel');
    const contentTitle = document.getElementById('content-title');
    const contentBody = document.getElementById('content-body');

    // --- Custom Lightweight Markdown Parser ---
    function parseMarkdown(mdText) {
        let html = '';
        let lines = mdText.split('\n');
        let inList = false;

        for(let line of lines) {
            let trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('### ')) {
                trimmedLine = `<h3>${trimmedLine.substring(4)}</h3>`;
            } else if (trimmedLine.startsWith('## ')) {
                trimmedLine = `<h2>${trimmedLine.substring(3)}</h2>`;
            } else if (trimmedLine.startsWith('# ')) {
                trimmedLine = `<h1>${trimmedLine.substring(2)}</h1>`;
            }
            
            if (trimmedLine.startsWith('- ')) {
                if (!inList) { html += '<ul>\n'; inList = true; }
                trimmedLine = `<li>${trimmedLine.substring(2)}</li>`;
            } else {
                if (inList) { html += '</ul>\n'; inList = false; }
                
                if (trimmedLine.length > 0 && !trimmedLine.startsWith('<h') && !trimmedLine.startsWith('<li')) {
                    if (line.endsWith('  ')) {
                        trimmedLine = `<p>${trimmedLine}<br></p>`;
                    } else {
                        trimmedLine = `<p>${trimmedLine}</p>`;
                    }
                }
            }

            trimmedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            trimmedLine = trimmedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
            trimmedLine = trimmedLine.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

            if (trimmedLine.length > 0) { html += trimmedLine + '\n'; }
        }
        if (inList) { html += '</ul>\n'; }
        return html;
    }

    // Helpers to open and close panels with animation-friendly behaviors
    function openPanel() {
        rightPanel.classList.add('active');
    }

    function closePanel() {
        rightPanel.classList.remove('active');
        // Wait for the slide-out transition to complete (400ms) before wiping text.
        // This ensures the user doesn't see content disappear while moving.
        setTimeout(() => {
            if (!rightPanel.classList.contains('active')) {
                contentBody.innerHTML = '';
            }
        }, 400);
    }

    // --- 1. Navigation Click Handler ---
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // Avoid triggering close logic immediately
            
            openPanel();
            
            contentTitle.textContent = link.textContent;
            contentBody.innerHTML = '<p>Loading...</p>';
            
            const targetId = link.getAttribute('data-target');
            const dataType = link.getAttribute('data-type');
            
            try {
                if (dataType === 'markdown') {
                    const response = await fetch(`content/${targetId}?_=${Date.now()}`);
                    if (!response.ok) throw new Error('File not found');
                    const markdownText = await response.text();
                    contentBody.innerHTML = parseMarkdown(markdownText);
                } else if (dataType === 'html') {
                    const template = document.getElementById(`tpl-${targetId}`);
                    if (template) {
                        contentBody.innerHTML = '';
                        contentBody.appendChild(template.content.cloneNode(true));
                        
                        if(targetId === 'contact') {
                            const form = document.getElementById('contactForm');
                            form?.addEventListener('submit', (formEvent) => {
                                formEvent.preventDefault();
                                alert("Since there's no backend configured, this form is currently display-only!");
                                form.reset();
                            });
                        }
                    } else {
                        throw new Error('Template not found');
                    }
                }
            } catch (error) {
                console.error("Error loading content:", error);
                contentBody.innerHTML = '<p>Error: Could not load content.</p>';
            }
        });
    });

    // --- 2. Close Button Handler ---
    closePanelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closePanel();
    });

    // --- 3. Click Outside Handler ---
    document.addEventListener('click', (e) => {
        if (rightPanel.classList.contains('active')) {
            if (!rightPanel.contains(e.target)) {
                closePanel();
            }
        }
    });
});
