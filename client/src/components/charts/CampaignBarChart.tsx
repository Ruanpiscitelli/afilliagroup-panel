import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface CampaignData {
    name: string;
    commissionCpa: number;
    commissionRev: number;
}

interface CampaignBarChartProps {
    data: CampaignData[];
    dataKey: 'commissionCpa' | 'commissionRev';
    title: string;
}

export function CampaignBarChart({ data, dataKey, title }: CampaignBarChartProps) {
    const colors = ['#1e3a5f', '#3b5998', '#8b9dc3', '#c5cdd9'];

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                {title}
                <span className="text-slate-400 text-xs">ℹ</span>
            </h3>
            <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 0, right: 60, left: 80, bottom: 0 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => label}
                        />
                        <Bar
                            dataKey={dataKey}
                            radius={[0, 4, 4, 0]}
                            label={{
                                position: 'right',
                                formatter: (value: number) => formatCurrency(value),
                                fontSize: 11,
                                fill: '#64748b'
                            }}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
