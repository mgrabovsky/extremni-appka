import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

import { DayExtended } from '../../schema';

const HIGHLIGHT_FROM_YEAR = 2019;

interface BarSpec {
    fill: string;
    height: number;
    title: string;
    x: number;
    y: number;
    width: number;
}

const colourScale = d3
    .scaleThreshold<number, string>()
    .range(['#d7d7d7', 'crimson'])
    .domain([HIGHLIGHT_FROM_YEAR]);

export interface SingleDayChartProps {
    data: DayExtended[];
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
    const xAxisEl = useRef<SVGGElement>(null);
    const yAxisEl = useRef<SVGGElement>(null);

    const [xScale, xAxis] = useMemo(() => {
        const range = [margin.left + 20, width - margin.right];
        const scale = d3.scaleBand<Date>().rangeRound(range).paddingInner(0.1);
        const axis = d3
            .axisBottom(scale)
            .ticks(width / 80)
            .tickFormat((d, _i) => d3.timeFormat('%b %d')(d as Date));
        return [scale, axis];
    }, [margin, width]);
    const [yScale, yAxis] = useMemo(() => {
        const scale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
        const axis = d3.axisLeft(scale).tickFormat((d) => `${d} °C`);
        return [scale, axis];
    }, [height, margin]);

    if (temps.length) {
        // The result of `d3.extent()` will always be total because `temps` is required
        // to be nonempty. Ditto for `d3.max()` and `d3.min()` below.
        // const timeDomain = d3.extent(temps, (d) => d.date) as [Date, Date];
        const [minTemp, maxTemp] = d3.extent(temps, (d) => d[metricField]) as [
            number,
            number
        ];
        const dateRange = d3.extent(temps, (d) => new Date(2000, d.month - 1, d.day)) as [
            Date,
            Date
        ];

        xScale.domain(d3.timeDays(dateRange[0], d3.timeDay.offset(dateRange[1])));
        yScale.domain([minTemp - 2, maxTemp + 2]);
    }

    const bars = useMemo<BarSpec[]>(
        () =>
            temps.map((d) => {
                // const fill = 'rgba(0,0,0,.2)';
                const fill = colourScale(d.year);
                const title = `${d.date.toLocaleDateString()}: ${d[metricField]} °C`;
                const x = xScale(new Date(2000, d.month - 1, d.day));
                const y = yScale(d[metricField]);
                return {
                    fill,
                    height: d.year >= HIGHLIGHT_FROM_YEAR ? 5 : 3,
                    title,
                    x: x || 0,
                    y,
                    width: xScale.bandwidth(),
                };
            }),
        [metricField, temps, xScale, yScale]
    );

    useEffect(() => {
        if (xAxisEl.current) d3.select(xAxisEl.current).call(xAxis);
        if (yAxisEl.current) d3.select(yAxisEl.current).call(yAxis);
        // }, [colourScale, metricField, temps, xAxis, xScale, yAxis, yScale]);
    }, [xAxis, yAxis]);

    return (
        <div>
            <p>
                Last three years <b style={{ color: 'crimson' }}>highligted</b>.
            </p>
            <svg height={height} width={width} viewBox={`0 0 ${width} ${height}`}>
                <g>
                    <g
                        ref={xAxisEl}
                        transform={`translate(0, ${height - margin.bottom})`}
                    />
                    <g ref={yAxisEl} transform={`translate(${margin.left}, 0)`} />
                </g>
                {bars?.map(({ title, ...bar }, i) => (
                    <rect {...bar} key={i}>
                        <title>{title}</title>
                    </rect>
                ))}
            </svg>
        </div>
    );
}
