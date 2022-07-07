import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

import { Dataset } from '../Schema';

interface BarSpec {
    fill: string;
    height: number;
    title: string;
    x: number;
    y: number;
    width: number;
}

export interface SingleDayChartProps {
    data: Dataset;
    height: number;
    margin: {
        bottom: number;
        left: number;
        right: number;
        top: number;
    };
    metricField: 'avg' | 'high' | 'low';
    width: number;
}

export function SingleDayChart(props: SingleDayChartProps) {
    const { data: temps, height, margin, metricField, width } = props;
    const [bars, setBars] = useState<BarSpec[]>();
    const xAxisEl = useRef<SVGGElement>(null);
    const yAxisEl = useRef<SVGGElement>(null);

    const [xScale, xAxis] = useMemo(() => {
        const scale = d3.scaleLinear().range([margin.left + 20, width - margin.right]);
        const axis = d3.axisBottom(scale);
        return [scale, axis];
    }, [margin, width]);
    const [yScale, yAxis] = useMemo(() => {
        const scale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
        const axis = d3.axisLeft(scale).tickFormat((d) => `${d} °C`);
        return [scale, axis];
    }, [height, margin]);
    const colourScale = useMemo(
        () =>
            d3
                .scaleThreshold<number, string>()
                .range(['rgba(0,0,0,.2)', 'tomato'])
                .domain([2017]),
        []
    );

    useEffect(() => {
        if (!temps) return;

        // The result of `d3.extent()` will always be total because `temps` is required
        // to be nonempty. Ditto for `d3.max()` and `d3.min()` below.
        // const timeDomain = d3.extent(temps, (d) => d.date) as [Date, Date];
        const [minTemp, maxTemp] = d3.extent(temps, (d) => d[metricField]) as [
            number,
            number
        ];
        const maxDay = d3.max(temps, (d) => d.day)!;

        xScale.domain([1, maxDay]);
        yScale.domain([minTemp - 2, maxTemp + 2]);

        setBars(
            temps.map((d) => {
                // const fill = 'rgba(0,0,0,.2)';
                const fill = colourScale(d.year);
                const title = `${d.date.toLocaleDateString()}: ${d[metricField]} °C`;
                const x = xScale(d.day - 0.5);
                const y = yScale(d[metricField]);
                return {
                    fill,
                    height: 3,
                    title,
                    x,
                    y,
                    width: 20,
                };
            })
        );

        if (xAxisEl.current) d3.select(xAxisEl.current).call(xAxis);
        if (yAxisEl.current) d3.select(yAxisEl.current).call(yAxis);
    }, [colourScale, metricField, temps, xAxis, xScale, yAxis, yScale]);

    return (
        <svg height={height} width={width} viewBox={`0 0 ${width} ${height}`}>
            <g>
                <g ref={xAxisEl} transform={`translate(0, ${height - margin.bottom})`} />
                <g ref={yAxisEl} transform={`translate(${margin.left}, 0)`} />
            </g>
            {bars?.map(({ title, ...bar }, i) => (
                <rect {...bar} key={i}>
                    <title>{title}</title>
                </rect>
            ))}
        </svg>
    );
}
