'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { APIContext, APIContextOption, SandboxSuggestion } from '@/lib/sandbox-types';
import type { HttpMethod } from '@/lib/types';

interface Props {
    context: APIContext;
    customContext: string;
    onContextChange: (ctx: APIContext) => void;
    onCustomContextChange: (desc: string) => void;
    onSuggestionClick: (suggestion: SandboxSuggestion) => void;
}

const CONTEXTS: APIContextOption[] = [
    { value: 'ecommerce', label: 'E-Commerce API', description: 'Products, carts, orders, users', icon: '🛒' },
    { value: 'social', label: 'Social Media API', description: 'Posts, comments, likes, followers', icon: '📱' },
    { value: 'banking', label: 'Banking API', description: 'Accounts, transactions, transfers', icon: '🏦' },
    { value: 'healthcare', label: 'Healthcare API', description: 'Patients, appointments, records', icon: '🏥' },
    { value: 'saas', label: 'SaaS Platform API', description: 'Users, teams, subscriptions, billing', icon: '☁️' },
    { value: 'iot', label: 'IoT Device API', description: 'Devices, sensors, readings, alerts', icon: '📡' },
    { value: 'custom', label: 'Custom API', description: 'Describe your own API', icon: '✨' },
];

const SUGGESTIONS: Record<APIContext, SandboxSuggestion[]> = {
    ecommerce: [
        { method: 'GET', path: '/api/products', headers: {}, query: { category: 'electronics', limit: '5' }, body: '', label: 'GET /api/products?category=electronics' },
        { method: 'POST', path: '/api/cart/items', headers: { 'Content-Type': 'application/json' }, query: {}, body: '{\n  "productId": "PROD-001",\n  "quantity": 2\n}', label: 'POST /api/cart/items' },
        { method: 'GET', path: '/api/orders/ORD-2024-001', headers: { 'Authorization': 'Bearer demo-token' }, query: {}, body: '', label: 'GET /api/orders/ORD-2024-001' },
        { method: 'DELETE', path: '/api/cart/items/3', headers: { 'Authorization': 'Bearer demo-token' }, query: {}, body: '', label: 'DELETE /api/cart/items/3' },
    ],
    social: [
        { method: 'GET', path: '/api/posts', headers: {}, query: { page: '1', limit: '10' }, body: '', label: 'GET /api/posts?page=1' },
        { method: 'POST', path: '/api/posts', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-token' }, query: {}, body: '{\n  "content": "Hello world!",\n  "visibility": "public"\n}', label: 'POST /api/posts' },
        { method: 'POST', path: '/api/posts/42/like', headers: { 'Authorization': 'Bearer demo-token' }, query: {}, body: '', label: 'POST /api/posts/42/like' },
        { method: 'GET', path: '/api/users/alice/followers', headers: {}, query: { page: '1' }, body: '', label: 'GET /api/users/alice/followers' },
    ],
    banking: [
        { method: 'GET', path: '/api/accounts', headers: { 'Authorization': 'Bearer demo-token' }, query: {}, body: '', label: 'GET /api/accounts' },
        { method: 'POST', path: '/api/transfers', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-token' }, query: {}, body: '{\n  "fromAccount": "ACC-001",\n  "toAccount": "ACC-002",\n  "amount": 150.00,\n  "currency": "USD"\n}', label: 'POST /api/transfers' },
        { method: 'GET', path: '/api/accounts/ACC-001/transactions', headers: { 'Authorization': 'Bearer demo-token' }, query: { limit: '10' }, body: '', label: 'GET /api/accounts/.../transactions' },
    ],
    healthcare: [
        { method: 'GET', path: '/api/patients/P-12345', headers: { 'Authorization': 'Bearer demo-token' }, query: {}, body: '', label: 'GET /api/patients/P-12345' },
        { method: 'POST', path: '/api/appointments', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-token' }, query: {}, body: '{\n  "patientId": "P-12345",\n  "doctorId": "D-789",\n  "date": "2024-06-15",\n  "time": "10:30"\n}', label: 'POST /api/appointments' },
        { method: 'GET', path: '/api/doctors', headers: { 'Authorization': 'Bearer demo-token' }, query: { specialty: 'cardiology' }, body: '', label: 'GET /api/doctors?specialty=cardiology' },
    ],
    saas: [
        { method: 'GET', path: '/api/teams', headers: { 'Authorization': 'Bearer demo-token' }, query: {}, body: '', label: 'GET /api/teams' },
        { method: 'POST', path: '/api/users/invite', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-token' }, query: {}, body: '{\n  "email": "new@example.com",\n  "role": "member",\n  "teamId": "team-001"\n}', label: 'POST /api/users/invite' },
        { method: 'GET', path: '/api/billing/invoices', headers: { 'Authorization': 'Bearer demo-token' }, query: { status: 'unpaid' }, body: '', label: 'GET /api/billing/invoices?status=unpaid' },
    ],
    iot: [
        { method: 'GET', path: '/api/devices', headers: { 'Authorization': 'Bearer demo-token' }, query: { status: 'online' }, body: '', label: 'GET /api/devices?status=online' },
        { method: 'GET', path: '/api/devices/SENS-42/readings', headers: { 'Authorization': 'Bearer demo-token' }, query: { last: '24h' }, body: '', label: 'GET /api/devices/SENS-42/readings' },
        { method: 'POST', path: '/api/alerts', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-token' }, query: {}, body: '{\n  "deviceId": "SENS-42",\n  "type": "threshold",\n  "condition": "temperature > 85"\n}', label: 'POST /api/alerts' },
    ],
    custom: [
        { method: 'GET', path: '/api/resources', headers: {}, query: { page: '1' }, body: '', label: 'GET /api/resources?page=1' },
        { method: 'POST', path: '/api/resources', headers: { 'Content-Type': 'application/json' }, query: {}, body: '{\n  "name": "Example",\n  "type": "demo"\n}', label: 'POST /api/resources' },
        { method: 'GET', path: '/api/resources/1', headers: {}, query: {}, body: '', label: 'GET /api/resources/1' },
    ],
};

export default function SandboxConfig({ context, customContext, onContextChange, onCustomContextChange, onSuggestionClick }: Props) {
    const [expanded, setExpanded] = useState(true);
    const suggestions = SUGGESTIONS[context] || [];

    return (
        <aside className="w-72 min-w-[280px] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full">
            {/* Header */}
            <div className="px-5 pt-6 pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-cyan-500/25">
                        ⚡
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-[var(--text-primary)]">AI Sandbox</h1>
                        <p className="text-xs text-[var(--text-muted)]">Send any request, learn from AI</p>
                    </div>
                </div>
            </div>

            {/* Navigation links */}
            <div className="px-3 pt-3 space-y-1.5">
                <Link href="/lesson/get-query-basics">
                    <motion.div
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-hover)]/50 border border-transparent hover:border-violet-500/20 hover:bg-violet-600/10 transition-all flex items-center gap-2.5 group"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-sm">📡</span>
                        <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-violet-400 transition-colors">Lessons</span>
                    </motion.div>
                </Link>
                <Link href="/interview">
                    <motion.div
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-hover)]/50 border border-transparent hover:border-violet-500/20 hover:bg-violet-600/10 transition-all flex items-center gap-2.5 group"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-sm">🎯</span>
                        <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-violet-400 transition-colors">Interview Prep</span>
                    </motion.div>
                </Link>
            </div>

            {/* Context Selector */}
            <div className="px-3 pt-4 flex-1 overflow-y-auto">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center gap-2 px-2 mb-2"
                >
                    <motion.span animate={{ rotate: expanded ? 90 : 0 }} className="text-[10px] text-[var(--text-muted)]">▶</motion.span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">API Context</span>
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-1 overflow-hidden"
                        >
                            {CONTEXTS.map((ctx) => (
                                <motion.button
                                    key={ctx.value}
                                    onClick={() => {
                                        onContextChange(ctx.value);
                                        // Auto-fill the first quick-start for this context
                                        const firstSuggestion = SUGGESTIONS[ctx.value]?.[0];
                                        if (firstSuggestion) {
                                            onSuggestionClick(firstSuggestion);
                                        }
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2.5 border ${context === ctx.value
                                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] border-transparent'
                                        }`}
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="text-base flex-shrink-0">{ctx.icon}</span>
                                    <div className="min-w-0">
                                        <span className="font-medium block truncate">{ctx.label}</span>
                                        <span className="text-[10px] text-[var(--text-muted)] block truncate">{ctx.description}</span>
                                    </div>
                                </motion.button>
                            ))}

                            {/* Custom context input */}
                            <AnimatePresence>
                                {context === 'custom' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <textarea
                                            value={customContext}
                                            onChange={(e) => onCustomContextChange(e.target.value)}
                                            placeholder="Describe your API... e.g., A restaurant reservation system with tables, bookings, and waitlists."
                                            rows={3}
                                            maxLength={500}
                                            className="w-full mt-1 px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-cyan-500/50 transition-colors"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Start Suggestions */}
                {suggestions.length > 0 && (
                    <div className="mt-4">
                        <div className="flex items-center gap-1.5 px-2 mb-2">
                            <span className="text-xs">🚀</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Quick Start</span>
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={context}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="space-y-1"
                            >
                                {suggestions.map((s, i) => {
                                    const methodColor: Record<string, string> = {
                                        GET: 'text-emerald-400 bg-emerald-500/10',
                                        POST: 'text-blue-400 bg-blue-500/10',
                                        PUT: 'text-amber-400 bg-amber-500/10',
                                        PATCH: 'text-orange-400 bg-orange-500/10',
                                        DELETE: 'text-red-400 bg-red-500/10',
                                    };
                                    return (
                                        <motion.button
                                            key={`${context}-${i}`}
                                            onClick={() => onSuggestionClick(s)}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 group border border-transparent hover:border-[var(--border)]"
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${methodColor[s.method] || ''}`}>
                                                {s.method}
                                            </span>
                                            <span className="text-[11px] text-[var(--text-secondary)] font-mono truncate group-hover:text-[var(--text-primary)] transition-colors">
                                                {s.label.replace(`${s.method} `, '')}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[var(--border)]">
                <p className="text-[10px] text-[var(--text-muted)] text-center">AI responses are simulated for learning</p>
            </div>
        </aside>
    );
}
