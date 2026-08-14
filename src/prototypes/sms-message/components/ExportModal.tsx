/**
 * 导出弹窗：与发送记录导出交互一致，用于补发记录导出
 */
import React from 'react';

interface ExportModalProps {
    visible: boolean;
    defaultName: string;
    onClose: () => void;
    /** 隐藏文件格式选择，展示默认导出提示（黑名单导出用） */
    hideFormat?: boolean;
}

export default function ExportModal({ visible, defaultName, onClose, hideFormat }: ExportModalProps) {
    if (!visible) return null;
    return (
        <div className="sms-mask" onClick={onClose}>
            <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">导出</div>
                <div className="sms-modal-body">
                    <div className="sms-form-item">
                        <label className="sms-form-label">导出名称</label>
                        <div className="sms-form-control">
                            <input className="sms-input" defaultValue={defaultName} />
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
                </div>
                <div className="sms-modal-actions">
                    <button type="button" className="sms-btn" onClick={onClose}>
                        取消
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary" onClick={onClose}>
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
}
