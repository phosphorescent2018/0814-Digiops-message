/**
 * 补发中心：人工补发 / 自动补发
 */
import React, { useState } from 'react';
import { UserCog, Zap } from 'lucide-react';
import ManualResend from './resend/ManualResend';
import AutoResend from './resend/AutoResend';
import type { RecordFilter } from './resend/BatchDetail';

type ResendTab = 'manual' | 'auto';

interface ResendCenterProps {
    onSwitchTab?: (tab: 'record', filter?: RecordFilter) => void;
}

const TABS: { key: ResendTab; label: string; icon: React.ElementType }[] = [
    { key: 'manual', label: '人工补发', icon: UserCog },
    { key: 'auto', label: '自动补发', icon: Zap },
];

export default function ResendCenter({ onSwitchTab }: ResendCenterProps) {
    const [tab, setTab] = useState<ResendTab>('manual');

    return (
        <div className="sms-resend-center">
            <div className="resend-sub-tabs">
                {TABS.map((t) => (
                    <div
                        key={t.key}
                        className={`resend-sub-tab${tab === t.key ? ' active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        <t.icon size={15} strokeWidth={1.8} />
                        {t.label}
                    </div>
                ))}
            </div>
            {tab === 'manual' ? <ManualResend onSwitchTab={onSwitchTab} /> : <AutoResend onSwitchTab={onSwitchTab} />}
        </div>
    );
}
