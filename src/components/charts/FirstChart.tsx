import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

import { DayExtended } from '../../schema';

interface BarSpec {
    fill: string;
    height: number;
    title: string;
    x: number;
    y: number;
    width: number;
}

interface LegendProps {
    height: number;
    scale: d3.ScaleThreshold<number, string>;
    width: number;
}

function Legend(props: LegendProps) {
    const { height, scale, width } = props;
    const axisElement = useRef<SVGGElement>(null);
    const x = useMemo(
        () =>
            d3
                .scaleLinear()
                .domain([-1, scale.range().length - 1])
                .rangeRound([0, width]),
        [scale, width]
    );

    useEffect(() => {
        if (!axisElement.current) return;
        const thresholds = scale.domain();
        const thresholdFormat = (d: number, _i: number) => d.toString();
        const tickValues = d3.range(thresholds.length);
        const tickFormat = (i: d3.NumberValue, _j: number) =>
            thresholdFormat(thresholds[i.valueOf()], i.valueOf());
        d3.select(axisElement.current)
            .call(
                d3
                    .axisBottom(x)
                    .ticks(width / 64)
                    .tickFormat(tickFormat)
                    .tickSize(6)
                    .tickValues(tickValues)
            )
            .call((g) =>
                g.selectAll('.tick line').attr('y1', -height).attr('color', 'white')
            )
            .call((g) => g.select('.domain').remove());
    }, [height, scale, width, x]);

    return (
        <g>
            {scale.range().map((fill, i) => (
                <rect
                    fill={fill}
                    height={height}
                    key={i}
                    width={x(i) - x(i - 1)}
                    x={x(i - 1)}
                />
            ))}
            <g ref={axisElement} transform={`translate(0, ${height})`} />
        </g>
    );
}

export interface FirstChartProps {
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

const colourScale = d3
    .scaleThreshold<number, string>()
    // .range(['#ddd', 'tomato'])
    // .domain([2019]),
    .range(['#dbeff9', '#b3d8e3', '#98bdcd', '#89a1b8', '#8283a3', '#7f648f', '#7d417b'])
    .domain([1971, 1981, 1991, 2001, 2011, 2021]);

export function FirstChart(props: FirstChartProps) {
    const { data: temps, height, margin, metricField, width } = props;
    const xAxisEl = useRef<SVGGElement>(null);
    const yAxisEl = useRef<SVGGElement>(null);

    const [xScale, timeScale, xAxis] = useMemo(() => {
        const range: [number, number] = [margin.left + 20, width - margin.right];
        const scale = d3.scaleBand<Date>().rangeRound(range).paddingInner(0.1);
        const ts = d3.scaleTime().range(range);
        const axis = d3
            .axisBottom(ts)
            .ticks(width / 80)
            .tickFormat((d, _i) => d3.timeFormat('%b %d')(d as Date));
        return [scale, ts, axis] as const;
    }, [margin.left, margin.right, width]);
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
        timeScale.domain(dateRange);
        yScale.domain([minTemp - 2, maxTemp + 2]);
    }

    const bars: BarSpec[] | undefined = useMemo(() => {
        if (!temps) return;
        return temps.map((d) => {
            // const fill = 'rgba(0,0,0,.2)';
            const fill = colourScale(d.year);
            const title = `${d.date.toLocaleDateString()}: ${d[metricField]} °C`;
            const x = xScale(new Date(2000, d.month - 1, d.day));
            const y = yScale(d[metricField]);
            return {
                fill,
                height: 3,
                title,
                x: x || 0,
                y,
                width: xScale.bandwidth(),
            };
        });
    }, [metricField, temps, xScale, yScale]);

    useEffect(() => {
        if (xAxisEl.current) d3.select(xAxisEl.current).call(xAxis as any);
        if (yAxisEl.current) d3.select(yAxisEl.current).call(yAxis as any);
    }, [metricField, temps, xAxis, yAxis, yScale]);

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
            <g transform={`translate(${width - margin.right - 200}, 0)`}>
                <Legend height={10} scale={colourScale} width={200} />
            </g>
        </svg>
    );
}
