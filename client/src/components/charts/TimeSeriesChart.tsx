import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TimeSeriesData {
    date: string;
    registrations: number;
    ftds: number;
}

interface TimeSeriesChartProps {
    data: TimeSeriesData[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    Cadastros e FTD ao longo do tempo
                    <span className="text-slate-400 text-xs">ℹ</span>
                </h3>
            </div>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                    >
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => (
                                <span className="text-sm text-slate-600">
                                    {value === 'registrations' ? 'Cadastros' : 'FTDs'}
                                </span>
                            )}
                        />
                        <Line
                            type="monotone"
                            dataKey="registrations"
                            stroke="#1e3a5f"
                            strokeWidth={2}
                            dot={false}
                            name="registrations"
                        />
                        <Line
                            type="monotone"
                            dataKey="ftds"
                            stroke="#0ea5e9"
                            strokeWidth={2}
                            dot={false}
                            name="ftds"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
