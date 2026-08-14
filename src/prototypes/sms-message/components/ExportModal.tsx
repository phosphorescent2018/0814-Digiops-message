/**
 * 导出弹窗：与发送记录导出交互一致，用于补发记录导出
 */
import React, { useState } from 'react';

/** 黑名单导出演示用的成功/失败交替计数（模块级，跨弹窗挂载保持；仅 simulateFailure 时使用） */
let exportFailureCycle = 0;

interface ExportModalProps {
    visible: boolean;
    defaultName: string;
    onClose: () => void;
    /** 隐藏文件格式选择，展示默认导出提示（黑名单导出用） */
    hideFormat?: boolean;
    /** 要求用户填写导出名称：默认空值，未填写前确认按钮置灰 */
    requireName?: boolean;
    /** 点击确认后回调（用于成功提示等） */
    onConfirm?: () => void;
    /** 模拟导出失败：成功与失败交替出现，失败时弹窗不关闭并提示错误（黑名单演示用） */
    simulateFailure?: boolean;
}

export default function ExportModal({ visible, defaultName, onClose, hideFormat, requireName, onConfirm, simulateFailure }: ExportModalProps) {
    const [name, setName] = useState('');
    const [exportError, setExportError] = useState<string | null>(null);
    if (!visible) return null;
    const canConfirm = !requireName || name.trim() !== '';
    const handleConfirm = () => {
        if (requireName && simulateFailure) {
            exportFailureCycle += 1;
            if (exportFailureCycle % 2 === 0) {
                setExportError('导出失败：网络异常，请稍后重试');
                return;
            }
        }
        setExportError(null);
        onConfirm?.();
        onClose();
    };
    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">导出</div>
                <div className="sms-modal-body">
                    <div className="sms-form-item">
                        <label className="sms-form-label">导出名称</label>
                        <div className="sms-form-control">
                            {requireName ? (
                                <input
                                    className="sms-input"
                                    value={name}
                                    placeholder="请输入导出名称"
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setExportError(null);
                                    }}
                                />
                            ) : (
                                <input className="sms-input" defaultValue={defaultName} />
                            )}
                        </div>
                    </div>
                    {!hideFormat && (
                        <div className="sms-form-item">
                            <label className="sms-form-label">文件格式</label>
                            <div className="sms-form-control">
                                <select className="sms-select" defaultValue="EXECL">
                                    <option value="EXECL">EXECL</option>
                                </select>
                            </div>
                        </div>
                    )}
                    {hideFormat && <div className="export-format-tip">默认导出为 Excel 文件</div>}
                    {exportError && <div className="export-error">{exportError}</div>}
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取消
                    </button>
                    <button
                        type="button"
                        className="sms-btn sms-btn-primary"
                        disabled={!canConfirm}
                        onClick={handleConfirm}
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
}
