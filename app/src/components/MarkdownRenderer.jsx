import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/components/markdown.module.scss';

const MarkdownRenderer = ({ content }) => {
  const router = useRouter();
  
  if (!content) return null;

  // Handle example click navigation
  const handleExampleClick = (exampleText) => {
    // Clean up the example text and extract Korean sentence
    const cleanText = exampleText
      .replace(/<[^>]*>/g, '') // Remove any HTML tags
      .replace(/\n\s*\n/g, '\n') // Clean up extra newlines
      .trim();
    
    // Store in localStorage for the analyze page
    localStorage.setItem('pendingAnalysis', cleanText);
    
    // Navigate to analyze page
    router.push('/analyze');
  };

  // Simple markdown renderer for basic formatting and example tags
  const renderMarkdown = (text) => {
    let html = text;
    let exampleId = 0;

    // Handle example tags first - create unique IDs for each example
    html = html.replace(/<example>(.*?)<\/example>/gs, (match, example) => {
      const currentId = `example-${exampleId++}`;
      return `<div class="${styles.example}" data-example-id="${currentId}" data-example-text="${encodeURIComponent(example.trim())}">
        <div class="${styles.exampleIcon}">📝</div>
        <div class="${styles.exampleContent}">${example.trim()}</div>
        <div class="${styles.exampleAction}">
          <span class="${styles.clickHint}">Click to analyze →</span>
        </div>
      </div>`;
    });

    // Handle headers
    html = html.replace(/^### (.*$)/gm, `<h3 class="${styles.h3}">$1</h3>`);
    html = html.replace(/^## (.*$)/gm, `<h2 class="${styles.h2}">$1</h2>`);
    html = html.replace(/^# (.*$)/gm, `<h1 class="${styles.h1}">$1</h1>`);

    // Handle bold text
    html = html.replace(/\*\*(.*?)\*\*/g, `<strong class="${styles.bold}">$1</strong>`);
    
    // Handle italic text
    html = html.replace(/\*(.*?)\*/g, `<em class="${styles.italic}">$1</em>`);

    // Handle code spans
    html = html.replace(/`(.*?)`/g, `<code class="${styles.code}">$1</code>`);

    // Handle lists
    html = html.replace(/^- (.*$)/gm, `<li class="${styles.listItem}">$1</li>`);
    html = html.replace(/(<li class="[^"]*">.*<\/li>)/gs, `<ul class="${styles.list}">$1</ul>`);

    // Handle line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br/>');

    // Wrap in paragraphs if not already wrapped
    if (!html.includes('<h1') && !html.includes('<h2') && !html.includes('<h3') && !html.includes('<ul')) {
      html = `<p>${html}</p>`;
    }

    return html;
  };

  return (
    <div 
      className={styles.markdown}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      onClick={(e) => {
        // Check if clicked element is an example block
        const exampleElement = e.target.closest(`[data-example-id]`);
        if (exampleElement) {
          const exampleText = decodeURIComponent(exampleElement.dataset.exampleText);
          handleExampleClick(exampleText);
        }
      }}
    />
  );
};

export default MarkdownRenderer; 