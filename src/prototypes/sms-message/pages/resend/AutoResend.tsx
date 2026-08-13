/**
 * 自动补发：规则配置 + 运行统计 + 补发任务列表
 */
import React, { useState } from 'react';
import { Zap, Save, Check, RefreshCw } from 'lucide-react';

const STATS = [
    { label: '今日补发', value: 128, tone: '' },
    { label: '补发成功', value: 96, tone: 'success' },
    { label: '补发失败', value: 21, tone: 'danger' },
    { label: '队列中', value: 11, tone: 'warn' },
];

const TASKS = [
    { id: 1, time: '2026-08-12 13:20:05', phone: 'n6cHZ+wHVUE1uN3IqCAedg==', reason: '回执超时', times: '2/3', status: '已送达' },
    { id: 2, time: '2026-08-12 12:58:44', phone: '4U4I9nOEeJsD6sIIYO6MCw==', reason: '未送达', times: '1/3', status: '回执中' },
    { id: 3, time: '2026-08-12 12:47:12', phone: 'fMlMy9u5342709lpj03DYA==', reason: '发送失败', times: '1/3', status: '失败' },
    { id: 4, time: '2026-08-12 12:30:58', phone: 'tUAH5d+eIqihMk6w7bfD7w==', reason: '回执超时', times: '3/3', status: '已送达' },
];

const STATUS_CLASS: Record<string, string> = {
    已送达: 'sms-status-success',
    回执中: 'sms-status-delivering',
    失败: 'sms-status-fail',
};

export default function AutoResend() {
    const [enabled, setEnabled] = useState(true);
    const [saved, setSaved] = useState(false);
    const [conditions, setConditions] = useState(['未送达', '回执超时']);

    const toggleCondition = (value: string) => {
        setConditions((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    };

    const save = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="resend-auto">
            {/* 运行统计 */}
            <div className="resend-stat-row">
                {STATS.map((s) => (
                    <div className="resend-stat-card" key={s.label}>
                        <div className={`resend-stat-num resend-stat-${s.tone || 'normal'}`}>{s.value}</div>
                        <div className="resend-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* 规则配置 */}
            <div className="sms-card resend-section">
                <div className="resend-rule-header">
                    <div className="resend-rule-title-wrap">
                        <span className="resend-toolbar-title">
                            <Zap size={16} />
                            自动补发规则
                        </span>
                        <div className="resend-rule-tip">
                            <span>2026.8.24 日前的历史短信不参与自动补发</span>
                            <span>本规则默认全局生效，但配置了自动补发组件的运营计划除外</span>
                        </div>
                    </div>
                    <label className="resend-switch">
                        <input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} />
                        <span className="resend-switch-slider" />
                        <span className="resend-switch-text">{enabled ? '已开启' : '已关闭'}</span>
                    </label>
                </div>

                <div className={`resend-rule-body${enabled ? '' : ' resend-rule-disabled'}`}>
                    <div className="resend-form-grid">
                        <div className="sms-form-item">
                            <label className="sms-form-label">触发条件</label>
                            <div className="sms-form-control">
                                <div className="resend-cond-list">
                                    <div className="resend-cond-card">
                                        <div className="resend-cond-card-head">
                                            <span className="resend-cond-card-title">提交失败时</span>
                                            <span className="resend-cond-card-desc">无需等待回执</span>
                                        </div>
                                        <label className="resend-cond-option">
                                            <input
                                                type="checkbox"
                                                checked={conditions.includes('发送失败')}
                                                onChange={() => toggleCondition('发送失败')}
                                            />
                                            <span>发送失败</span>
                                        </label>
                                    </div>
                                    <div className="resend-cond-card">
                                        <div className="resend-cond-card-head">
                                            <span className="resend-cond-card-title">回执判定后</span>
                                            <span className="resend-cond-card-desc">未送达或 24 小时内无明确回执</span>
                                        </div>
                                        <div className="resend-cond-options">
                                            <label className="resend-cond-option">
                                                <input
                                                    type="checkbox"
                                                    checked={conditions.includes('未送达')}
                                                    onChange={() => toggleCondition('未送达')}
                                                />
                                                <span>未送达</span>
                                            </label>
                                            <label className="resend-cond-option">
                                                <input
                                                    type="checkbox"
                                                    checked={conditions.includes('回执超时')}
                                                    onChange={() => toggleCondition('回执超时')}
                                                />
                                                <span>回执超时</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">最多补发</label>
                            <div className="sms-form-control">
                                <select className="sms-select">
                                    <option value="1">1 次</option>
                                    <option value="2">2 次</option>
                                    <option value="3" selected>
                                        3 次
                                    </option>
                                    <option value="5">5 次</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">补发间隔</label>
                            <div className="sms-form-control">
                                <select className="sms-select">
                                    <option value="1">1 小时</option>
                                    <option value="2">2 小时</option>
                                    <option value="4" selected>
                                        4 小时
                                    </option>
                                    <option value="24">24 小时</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">补发内容</label>
                            <div className="sms-form-control">
                                <select className="sms-select">
                                    <option value="original" selected>
                                        沿用原短信内容
                                    </option>
                                    <option value="template">指定模板</option>
                                </select>
                            </div>
                        </div>
                        <div className="sms-form-item">
                            <label className="sms-form-label">生效时段</label>
                            <div className="sms-form-control">
                                <select className="sms-select">
                                    <option value="all" selected>
                                        全天
                                    </option>
                                    <option value="window">指定时段（08:00-22:00）</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="resend-rule-footer">
                        <button type="button" className="sms-btn sms-btn-primary" onClick={save} disabled={!enabled}>
                            {saved ? (
                                <>
                                    <Check size={14} />
                                    已保存
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    保存规则
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 任务列表 */}
            <div className="sms-card resend-section">
                <div className="sms-toolbar">
                    <span className="resend-toolbar-title">自动补发任务</span>
                    <div className="sms-toolbar-right">
                        <button type="button" className="sms-btn sms-btn-icon" title="刷新">
                            <RefreshCw size={15} />
                        </button>
                    </div>
                </div>
                <div className="sms-table-wrap">
                    <table className="sms-table resend-table resend-history-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>补发时间</th>
                                <th>手机号码</th>
                                <th>触发原因</th>
                                <th>补发次数</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TASKS.map((t) => (
                                <tr key={t.id}>
                                    <td>{t.id}</td>
                                    <td>{t.time}</td>
                                    <td>
                                        <span className="sms-cell">{t.phone}</span>
                                    </td>
                                    <td>
                                        <span className={`resend-reason resend-reason-${t.reason === '发送失败' ? 'fail' : t.reason === '回执超时' ? 'timeout' : 'undelivered'}`}>
                                            {t.reason}
                                        </span>
                                    </td>
                                    <td>{t.times}</td>
                                    <td>
                                        <span className={`sms-status ${STATUS_CLASS[t.status] ?? 'sms-status-unknown'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
