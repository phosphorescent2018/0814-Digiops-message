/**
 * 短信报表：统计时间筛选 + 近7天/30天/半年 + 发送数量/到达率/费用 + 明细表
 */
import React, { useState } from 'react';
import { RotateCcw, Search, ChevronUp, ListFilter, RefreshCw, Calendar } from 'lucide-react';
import { sendTrend, reportSummary, reportRows } from '../mockData';

function LineChart() {
    const width = 420;
    const height = 150;
    const pad = 24;
    const max = Math.max(...sendTrend.map((d) => d.count)) + 20;
    const stepX = (width - pad * 2) / (sendTrend.length - 1);

    const points = sendTrend.map((d, i) => ({
        x: pad + i * stepX,
        y: height - pad - (d.count / max) * (height - pad * 2),
    }));
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L${points[points.length - 1].x},${height - pad} L${points[0].x},${height - pad} Z`;

    return (
        <svg className="sms-line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id="smsLineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b8ff9" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#5b8ff9" stopOpacity="0.02" />
                </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((r) => (
                <line
                    key={r}
                    x1={pad}
                    x2={width - pad}
                    y1={pad + r * (height - pad * 2)}
                    y2={pad + r * (height - pad * 2)}
                    stroke="#eef0f5"
                    strokeDasharray="4 4"
                />
            ))}
            <path d={areaPath} fill="url(#smsLineFill)" />
            <path d={linePath} fill="none" stroke="#5b8ff9" strokeWidth="2" />
            {points.map((p, i) => (
                <circle key={sendTrend[i].date} cx={p.x} cy={p.y} r="3.5" fill="#5b8ff9" stroke="#fff" strokeWidth="1.5" />
            ))}
            {points.map((p, i) => (
                <text
                    key={sendTrend[i].date}
                    x={p.x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#98a1b8"
                >
                    {sendTrend[i].date.slice(5)}
                </text>
            ))}
        </svg>
    );
}

function DonutChart() {
    const r = 64;
    const c = 2 * Math.PI * r;
    const success = reportSummary.successCount;
    const total = reportSummary.totalCount || 1;
    const percent = success / total;

    return (
        <div className="sms-donut-wrap">
            <div className="sms-donut">
                <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r={r} fill="none" stroke="#dce7f3" strokeWidth="14" />
                    <circle
                        cx="80"
                        cy="80"
                        r={r}
                        fill="none"
                        stroke="#0a9afe"
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.max(percent * c - 4, 2)} ${c}`}
                        transform="rotate(-90 80 80)"
                    />
                </svg>
                <div className="sms-donut-center">
                    <strong>{reportSummary.arriveRate}%</strong>
                    <span>（{reportSummary.totalCount}）</span>
                </div>
            </div>
            <div className="sms-legend">
                <div className="sms-legend-item">
                    <span className="sms-legend-dot" style={{ background: '#0a9afe' }} />
                    成功数量: {reportSummary.successCount}
                </div>
                <div className="sms-legend-item">
                    <span className="sms-legend-dot" style={{ background: '#dce7f3' }} />
                    失败数量: {reportSummary.failCount}
                </div>
            </div>
        </div>
    );
}

function ReportTable() {
    return (
        <div className="sms-card sms-table-card">
            <div className="sms-toolbar">
                <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>短信发送明细</span>
                <div className="sms-toolbar-right">
                    <button type="button" className="sms-btn sms-btn-icon" title="刷新">
                        <RefreshCw size={15} />
                    </button>
                    <button type="button" className="sms-btn sms-btn-icon" title="列设置">
                        <ListFilter size={15} />
                    </button>
                </div>
            </div>
            <div className="sms-table-wrap">
                <table className="sms-table">
                    <thead>
                        <tr>
                            <th className="sms-col-index">序号</th>
                            <th className="sms-col-sendtime">发送时间</th>
                            <th className="sms-col-business">BusinessID</th>
                            <th className="sms-col-plan">计划名称</th>
                            <th className="sms-col-group">用户分组</th>
                            <th style={{ width: 120 }}>今日人数</th>
                            <th style={{ width: 120 }}>昨日人数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportRows.map((row) => (
                            <tr key={row.index}>
                                <td className="sms-col-index">{row.index}</td>
                                <td>{row.sendTime}</td>
                                <td>
                                    <span className="sms-cell">{row.businessId}</span>
                                </td>
                                <td>{row.planName}</td>
                                <td>{row.groupName}</td>
                                <td>{row.todayCount}</td>
                                <td>{row.yesterdayCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function ReportPage() {
    const [range, setRange] = useState('7');
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div>
            <div className="sms-card sms-search">
                <div className="sms-search-grid">
                    <div className="sms-form-item">
                        <label className="sms-form-label">统计时间</label>
                        <div className="sms-form-control">
                            <div className="sms-date-range">
                                <span>
                                    <Calendar size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                                    2026-08-05
                                </span>
                                <span className="arrow">→</span>
                                <span>2026-08-11</span>
                            </div>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">BusinessID</label>
                        <div className="sms-form-control">
                            <select className="sms-select placeholder">
                                <option value="">请选择</option>
                                <option value="MTN_UG_Account_id">MTN_UG_Account_id</option>
                            </select>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">运营计划</label>
                        <div className="sms-form-control">
                            <select className="sms-select placeholder">
                                <option value="">请选择</option>
                                <option value="计划A">计划A</option>
                            </select>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">客户分组</label>
                        <div className="sms-form-control">
                            <select className="sms-select placeholder">
                                <option value="">请选择</option>
                                <option value="全部用户">全部用户</option>
                            </select>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">短信模版</label>
                        <div className="sms-form-control">
                            <select className="sms-select placeholder">
                                <option value="">请选择</option>
                                <option value="MOMOADVANCE">MOMOADVANCE</option>
                            </select>
                        </div>
                    </div>
                    <div className="sms-form-item">
                        <label className="sms-form-label">发送名称</label>
                        <div className="sms-form-control">
                            <select className="sms-select placeholder">
                                <option value="">请选择</option>
                                <option value="MOMOADVANCE">MOMOADVANCE</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="sms-search-actions">
                    <button type="button" className="sms-btn">
                        <RotateCcw size={14} />
                        重置
                    </button>
                    <button type="button" className="sms-btn sms-btn-primary">
                        <Search size={14} />
                        查询
                    </button>
                    <button type="button" className="sms-btn sms-btn-link" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? '展开' : '收起'}
                        <ChevronUp size={14} style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
                    </button>
                </div>
            </div>

            <div className="sms-card sms-report-card">
                <div className="sms-quick-range">
                    {[
                        { value: '7', label: '近7天' },
                        { value: '30', label: '近30天' },
                        { value: '180', label: '近半年' },
                    ].map((r) => (
                        <button
                            type="button"
                            key={r.value}
                            className={`sms-range-btn${range === r.value ? ' active' : ''}`}
                            onClick={() => setRange(r.value)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                <div className="sms-report-grid">
                    <div className="sms-report-block">
                        <h3>短信发送数量</h3>
                        <LineChart />
                    </div>
                    <div className="sms-report-block">
                        <h3>到达率</h3>
                        <DonutChart />
                    </div>
                    <div className="sms-report-block" style={{ gridColumn: '1 / -1' }}>
                        <h3>短信发送费用</h3>
                        <div className="sms-report-stat">
                            <span className="sms-report-number">0</span>
                            <span className="sms-report-detail">费用总金额：0</span>
                        </div>
                    </div>
                </div>
            </div>

            <ReportTable />
        </div>
    );
}
