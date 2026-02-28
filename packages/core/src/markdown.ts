export class MarkdownParser {
  static parse(markdown: string): string {
    let html = markdown.replace(/\n{3,}/g, '\n\n');

    // 代码块
    html = html.replace(/```[\s\S]*?```/g, (match) => {
      const codeMatch = match.match(/```(\w+)?\n?([\s\S]*?)```/);
      return codeMatch ? `<pre><code>${codeMatch[2]}</code></pre>` : match;
    });

    // 表格
    html = this.parseTable(html);

    // 标题
    html = html
      .replace(/^### (.+)$/gim, '<h3>$1</h3>')
      .replace(/^## (.+)$/gim, '<h2>$1</h2>')
      .replace(/^# (.+)$/gim, '<h1>$1</h1>');

    // 粗体和斜体
    html = html
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // 列表
    html = this.parseList(html);

    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // 段落
    html = html
      .split('\n\n')
      .map((block) => {
        block = block.trim();
        if (!block) {return '';}
        if (
          block.startsWith('<h') ||
          block.startsWith('<ul>') ||
          block.startsWith('<ol>') ||
          block.startsWith('<pre>') ||
          block.startsWith('<table')
        ) {
          return block;
        }
        return '<p>' + block.replace(/\n/g, ' ') + '</p>';
      })
      .filter((b) => b)
      .join('');

    return this.cleanHTML(html);
  }

  private static parseTable(html: string): string {
    const tableRegex = /(\|.+\|[\r\n]+\|[\s\-:]+\|[\r\n]+(?:\|.+\|[\r\n]*)+)/g;
    return html.replace(tableRegex, (match) => {
      const rows = match.trim().split('\n').filter((row) => row.trim());
      if (rows.length < 2) {return match;}

      const headers = rows[0].split('|').map((h) => h.trim()).filter((h) => h);
      const alignments = rows[1]
        .split('|')
        .map((s) => {
          s = s.trim();
          if (s.startsWith(':') && s.endsWith(':')) {return 'center';}
          if (s.endsWith(':')) {return 'right';}
          return 'left';
        })
        .filter((_, i) => i < headers.length);

      let tableHTML = '<table class="markdown-table"><thead><tr>';
      headers.forEach((header, i) => {
        tableHTML += `<th style="text-align: ${alignments[i] || 'left'}">${header}</th>`;
      });
      tableHTML += '</tr></thead><tbody>';

      rows.slice(2).forEach((row) => {
        const cells = row.split('|').map((c) => c.trim()).filter((c) => c);
        tableHTML += '<tr>';
        cells.forEach((cell, i) => {
          tableHTML += `<td style="text-align: ${alignments[i] || 'left'}">${cell}</td>`;
        });
        tableHTML += '</tr>';
      });

      return tableHTML + '</tbody></table>';
    });
  }

  private static parseList(html: string): string {
    const lines = html.split('\n');
    let inUnorderedList = false;
    let inOrderedList = false;
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];

      if (/^[-*]\s+(.+)/.test(line)) {
        if (!inUnorderedList) {
          processedLines.push('<ul>');
          inUnorderedList = true;
        }
        processedLines.push(line.replace(/^[-*]\s+(.+)/, '<li>$1</li>'));
        if (!nextLine || !/^[-*]\s+/.test(nextLine)) {
          processedLines.push('</ul>');
          inUnorderedList = false;
        }
      } else if (/^\d+\.\s+(.+)/.test(line)) {
        if (!inOrderedList) {
          processedLines.push('<ol>');
          inOrderedList = true;
        }
        processedLines.push(line.replace(/^\d+\.\s+(.+)/, '<li>$1</li>'));
        if (!nextLine || !/^\d+\.\s+/.test(nextLine)) {
          processedLines.push('</ol>');
          inOrderedList = false;
        }
      } else {
        processedLines.push(line);
      }
    }

    return processedLines.join('\n');
  }

  private static cleanHTML(html: string): string {
    return html
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<p>(<h[123]>)/g, '$1')
      .replace(/(<\/h[123]>)<\/p>/g, '$1')
      .replace(/<p>(<ul>)/g, '$1')
      .replace(/(<\/ul>)<\/p>/g, '$1')
      .replace(/<p>(<ol>)/g, '$1')
      .replace(/(<\/ol>)<\/p>/g, '$1')
      .replace(/<p>(<pre>)/g, '$1')
      .replace(/(<\/pre>)<\/p>/g, '$1')
      .replace(/<p>(<table)/g, '$1')
      .replace(/(<\/table>)<\/p>/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
}
