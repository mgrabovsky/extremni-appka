import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

import { DayExtended } from '../../Schema';

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

export function FirstChart(props: FirstChartProps) {
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
                // .range(['#ddd', 'tomato'])
                // .domain([2019]),
                .range([
                    '#dbeff9',
                    '#b3d8e3',
                    '#98bdcd',
                    '#89a1b8',
                    '#8283a3',
                    '#7f648f',
                    '#7d417b',
                ])
                .domain([1971, 1981, 1991, 2001, 2011, 2021]),
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
            <g transform={`translate(${width - margin.right - 200}, 0)`}>
                <Legend height={10} scale={colourScale} width={200} />
            </g>
        </svg>
    );
}
