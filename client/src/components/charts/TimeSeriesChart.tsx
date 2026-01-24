import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';

interface TimeSeriesData {
    date: string;
    registrations: number;
    ftds: number;
}

interface TimeSeriesChartProps {
    data: TimeSeriesData[];
}

// Custom tooltip with modern dark styling
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 min-w-[140px]">
                <p className="font-medium text-slate-300 text-xs mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-slate-300">
                                {entry.dataKey === 'registrations' ? 'Cadastros' : 'FTDs'}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-white">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Custom legend renderer
const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
    if (!payload) return null;

    return (
        <div className="flex items-center justify-center gap-6 pt-4">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium text-slate-600">
                        {entry.value === 'registrations' ? 'Cadastros' : 'FTDs'}
                    </span>
                </div>
            ))}
        </div>
    );
};

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    Cadastros e FTD ao longo do tempo
                    <span className="text-slate-400 text-xs cursor-help" title="Mostra a evolução de cadastros e depósitos">ℹ</span>
                </h3>
            </div>
            <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="registrationsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="ftdsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            strokeOpacity={0.6}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={10}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={5}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} />

                        {/* Registrations Area */}
                        <Area
                            type="monotone"
                            dataKey="registrations"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fill="url(#registrationsGradient)"
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: '#8b5cf6',
                                stroke: '#fff',
                                strokeWidth: 2,
                            }}
                            name="registrations"
                        />

                        {/* FTDs Area */}
                        <Area
                            type="monotone"
                            dataKey="ftds"
                            stroke="#06b6d4"
                            strokeWidth={3}
                            fill="url(#ftdsGradient)"
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: '#06b6d4',
                                stroke: '#fff',
                                strokeWidth: 2,
                            }}
                            name="ftds"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
