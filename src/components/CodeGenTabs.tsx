'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { HttpMethod } from '@/lib/types';

interface Props {
    method: HttpMethod;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
}

type Tab = 'curl' | 'fetch' | 'axios' | 'python';

function generateCurl({ method, path, headers, query, body }: Props): string {
    const qstr = Object.entries(query).filter(([k]) => k).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const url = `http://api.example.com${path}${qstr ? `?${qstr}` : ''}`;
    let cmd = `curl -X ${method} "${url}"`;
    for (const [k, v] of Object.entries(headers)) {
        if (k) cmd += ` \\\n  -H "${k}: ${v}"`;
    }
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        cmd += ` \\\n  -d '${body}'`;
    }
    return cmd;
}

function generateFetch({ method, path, headers, query, body }: Props): string {
    const qstr = Object.entries(query).filter(([k]) => k).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const url = `http://api.example.com${path}${qstr ? `?${qstr}` : ''}`;
    const opts: string[] = [`  method: '${method}'`];
    if (Object.keys(headers).length > 0) {
        const hObj = Object.entries(headers).filter(([k]) => k).map(([k, v]) => `    '${k}': '${v}'`).join(',\n');
        opts.push(`  headers: {\n${hObj}\n  }`);
    }
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        opts.push(`  body: JSON.stringify(${body})`);
    }
    return `const response = await fetch('${url}', {\n${opts.join(',\n')}\n});\nconst data = await response.json();`;
}

function generateAxios({ method, path, headers, query, body }: Props): string {
    const m = method.toLowerCase();
    const hasBody = ['post', 'put', 'patch'].includes(m) && body;
    let code = `import axios from 'axios';\n\n`;
    code += `const response = await axios.${m}(\n  'http://api.example.com${path}'`;
    if (hasBody) {
        code += `,\n  ${body}`;
    }
    const config: string[] = [];
    if (Object.keys(query).filter(k => k).length > 0) {
        const params = Object.entries(query).filter(([k]) => k).map(([k, v]) => `    ${k}: '${v}'`).join(',\n');
        config.push(`  params: {\n${params}\n  }`);
    }
    if (Object.keys(headers).filter(k => k).length > 0) {
        const hObj = Object.entries(headers).filter(([k]) => k).map(([k, v]) => `    '${k}': '${v}'`).join(',\n');
        config.push(`  headers: {\n${hObj}\n  }`);
    }
    if (config.length > 0) {
        code += `,\n  {\n${config.join(',\n')}\n  }`;
    }
    code += `\n);\nconsole.log(response.data);`;
    return code;
}

function generatePython({ method, path, headers, query, body }: Props): string {
    const qstr = Object.entries(query).filter(([k]) => k);
    let code = `import requests\n\n`;
    code += `response = requests.${method.toLowerCase()}(\n  'http://api.example.com${path}'`;
    if (qstr.length > 0) {
        const params = qstr.map(([k, v]) => `    '${k}': '${v}'`).join(',\n');
        code += `,\n  params={\n${params}\n  }`;
    }
    const hdrs = Object.entries(headers).filter(([k]) => k);
    if (hdrs.length > 0) {
        const hObj = hdrs.map(([k, v]) => `    '${k}': '${v}'`).join(',\n');
        code += `,\n  headers={\n${hObj}\n  }`;
    }
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        code += `,\n  json=${body}`;
    }
    code += `\n)\nprint(response.json())`;
    return code;
}

export default function CodeGenTabs(props: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('curl');
    const [copied, setCopied] = useState(false);

    const code = useMemo(() => {
        switch (activeTab) {
            case 'curl': return generateCurl(props);
            case 'fetch': return generateFetch(props);
            case 'axios': return generateAxios(props);
            case 'python': return generatePython(props);
        }
    }, [activeTab, props]);

    const copy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const tabs: { id: Tab; label: string }[] = [
        { id: 'curl', label: 'cURL' },
        { id: 'fetch', label: 'Fetch' },
        { id: 'axios', label: 'Axios' },
        { id: 'python', label: 'Python' },
    ];

    return (
        <div className="bg-[var(--bg)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-2">
                <div className="flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 text-[10px] font-semibold transition-colors relative
                ${activeTab === tab.id ? 'text-violet-400' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}
              `}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="code-tab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                                    transition={{ duration: 0.2 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
                <motion.button
                    onClick={copy}
                    className="px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] hover:text-violet-400 transition-colors"
                    whileTap={{ scale: 0.95 }}
                >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                </motion.button>
            </div>
            <pre className="p-3 text-[11px] text-[var(--text-secondary)] overflow-auto max-h-48 font-mono leading-relaxed">
                {code}
            </pre>
        </div>
    );
}
