import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList, CartesianGrid } from 'recharts';
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

// Single color for all bars - clean look
const BAR_COLOR = '#1e3a5f';

// Format large numbers with k suffix
const formatAxisValue = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
};

// Custom tooltip - simple and clean
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white px-3 py-2 rounded shadow-lg border border-slate-200 text-sm">
                <p className="font-medium text-slate-700">{label}</p>
                <p className="text-slate-900 font-semibold">
                    {formatCurrency(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export function CampaignBarChart({ data, dataKey }: CampaignBarChartProps) {
    // Sort data by value descending and take top 4
    const sortedData = [...data]
        .sort((a, b) => b[dataKey] - a[dataKey])
        .slice(0, 4);

    // Calculate max value for domain
    const maxValue = Math.max(...sortedData.map(d => d[dataKey]), 0);
    const domainMax = maxValue * 1.2;

    return (
        <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 0, right: 70, left: 0, bottom: 0 }}
                    barCategoryGap="15%"
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#f1f5f9"
                    />
                    <XAxis
                        type="number"
                        domain={[0, domainMax]}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatAxisValue}
                        tickCount={5}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={70}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    />
                    <Bar
                        dataKey={dataKey}
                        radius={[0, 2, 2, 0]}
                        barSize={18}
                    >
                        {sortedData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={BAR_COLOR} />
                        ))}
                        <LabelList
                            dataKey={dataKey}
                            position="right"
                            formatter={(value: any) => formatCurrency(value)}
                            style={{
                                fontSize: 10,
                                fill: '#64748b',
                            }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
