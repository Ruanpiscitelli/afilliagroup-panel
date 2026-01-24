interface FunnelData {
    date: string;
    clicks: number;
    registrations: number;
    ftds: number;
    qualifiedCpa: number;
}

interface FunnelChartProps {
    data: FunnelData[];
}

export function FunnelChart({ data }: FunnelChartProps) {
    // Aggregate data from database
    const totals = data.reduce(
        (acc, item) => ({
            clicks: acc.clicks + item.clicks,
            registrations: acc.registrations + item.registrations,
            ftds: acc.ftds + item.ftds,
            qualifiedCpa: acc.qualifiedCpa + item.qualifiedCpa,
        }),
        { clicks: 0, registrations: 0, ftds: 0, qualifiedCpa: 0 }
    );

    // Colors from light (left) to dark (right)
    const funnelData = [
        { label: 'Cadastros', value: totals.registrations, color: '#8293B2' },
        { label: 'FTDs', value: totals.ftds, color: '#5C6F90' },
        { label: 'CPA Qualificados', value: totals.qualifiedCpa, color: '#354A6E' },
    ];

    const width = 836;
    const height = 112;
    const sectionWidth = width / funnelData.length;
    const maxVal = funnelData[0].value || 1;

    // Y position - FIRST is always highest (Y closest to 0)
    const getY = (value: number) => {
        const ratio = value / maxVal;
        return height * (1 - ratio);
    };

    return (
        <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Stats Header with centered percentage badges */}
            <div className="flex relative">
                {funnelData.map((item, i) => (
                    <div
                        key={i}
                        className={`flex-1 p-5 pb-16 ${i < funnelData.length - 1 ? 'border-r border-slate-100' : ''}`}
                    >
                        <p className="text-sm text-slate-500 font-medium">{item.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{item.value}</p>
                    </div>
                ))}

                {/* Centered percentage badges on the dividing lines */}
                {funnelData.slice(1).map((item, i) => {
                    const prevValue = funnelData[i].value;
                    if (prevValue === 0) return null;
                    const percentage = ((item.value / prevValue) * 100).toFixed(1);

                    return (
                        <div
                            key={`badge-${i}`}
                            className="absolute bottom-4"
                            style={{
                                left: `${((i + 1) / funnelData.length) * 100}%`,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600">
                                {percentage}% <span className="text-slate-400">→</span>
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* SVG Funnel */}
            <svg
                width="100%"
                height="112"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className="overflow-visible block"
                style={{ clipPath: 'inset(0px)', transition: 'clip-path 0.8s ease-out' }}
            >
                {funnelData.map((item, index) => {
                    const x = index * sectionWidth;
                    const y = getY(item.value);
                    const nextY = index < funnelData.length - 1
                        ? getY(funnelData[index + 1].value)
                        : y;
                    const sectionEnd = (index + 1) * sectionWidth;

                    // Curve zones
                    const flatEnd = x + sectionWidth * 0.33;
                    const curveQ1 = flatEnd + 20;
                    const curveMid = x + sectionWidth * 0.5;
                    const curveQ2 = sectionEnd - 20;

                    if (index === funnelData.length - 1) {
                        // Last section - rectangle
                        return (
                            <g key={index}>
                                <rect x={x} y={y} width={sectionWidth} height={height - y} fill={item.color} />
                                <rect x={x} y={y} width={sectionWidth} height={15} fill="rgba(255, 255, 255, 0.6)" />
                            </g>
                        );
                    }

                    // Main colored path with S-curve
                    const mainPath = `
            M ${x} ${height}
            L ${x} ${y}
            L ${flatEnd} ${y}
            Q ${curveQ1} ${y}, ${curveMid} ${(y + nextY) / 2}
            Q ${curveQ2} ${nextY}, ${sectionEnd} ${nextY}
            L ${sectionEnd} ${height}
            Z
          `;

                    // Highlight stripe
                    const highlightPath = `
            M ${x} ${y}
            L ${flatEnd} ${y}
            Q ${curveQ1} ${y}, ${curveMid} ${(y + nextY) / 2}
            Q ${curveQ2} ${nextY}, ${sectionEnd} ${nextY}
            L ${sectionEnd} ${nextY + 15}
            Q ${curveQ2} ${nextY + 15}, ${curveMid} ${(y + nextY) / 2 + 15}
            Q ${curveQ1} ${y + 15}, ${flatEnd} ${y + 15}
            L ${x} ${y + 15}
            Z
          `;

                    return (
                        <g key={index}>
                            <path d={mainPath} fill={item.color} />
                            <path d={highlightPath} fill="rgba(255, 255, 255, 0.6)" />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
