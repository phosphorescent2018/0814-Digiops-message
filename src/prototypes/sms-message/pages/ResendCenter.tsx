/**
 * 人工补发：补发中心已更名为「人工补发」，不再包含自动补发子页
 */
import React from 'react';
import ManualResend from './resend/ManualResend';
import type { RecordFilter } from './resend/BatchDetail';

interface ResendCenterProps {
    onSwitchTab?: (tab: 'record', filter?: RecordFilter) => void;
    incomingBatchId?: string;
}

export default function ResendCenter({ onSwitchTab, incomingBatchId }: ResendCenterProps) {
    return (
        <div className="sms-resend-center">
            <ManualResend onSwitchTab={onSwitchTab} incomingBatchId={incomingBatchId} />
        </div>
    );
}
