import * as d3 from 'd3';
import { useCallback, useEffect, useMemo, useRef } from 'react';

export interface DateBrushProps {
    height: number;
    onChange?(selection: [Date, Date]): any;
    width: number;
}

const DAILY_INTERVAL = d3.timeDay.every(1);

export function DateBrush(props: DateBrushProps) {
    const { height, onChange, width } = props;

    const brushRef = useRef<SVGGElement>(null);
    const xAxisRef = useRef<SVGGElement>(null);

    const brush = useMemo(
        () =>
            d3.brushX<Date>().extent([
                [0, 0],
                [width, height - 20],
            ]),
        [height, width]
    );

    const x = useMemo(
        () =>
            d3
                .scaleTime()
                .domain([new Date(2000, 0, 1), new Date(2000, 11, 31)])
                .rangeRound([0, width]),
        [width]
    );

    const xAxis = useCallback(
        (g: d3.Selection<SVGGElement, Date, null, undefined>) =>
            g
                .call((g) =>
                    g
                        .append('g')
                        .call(
                            d3
                                .axisBottom(x)
                                .ticks(d3.timeMonth)
                                .tickSize(20 - height)
                                .tickFormat(() => '')
                        )
                        .call((g) =>
                            g.select('.domain').attr('fill', '#ddd').attr('stroke', null)
                        )
                        .call((g) => g.selectAll('.tick line').attr('stroke', '#fff'))
                        .call((g) => g.selectAll('.tick text').remove())
                )
                .call((g) =>
                    g
                        .append('g')
                        .call(
                            d3
                                .axisBottom<Date>(x)
                                .ticks(d3.timeMonth)
                                .tickPadding(0)
                                .tickFormat(d3.timeFormat('%B'))
                        )
                        .attr('text-anchor', null)
                        .call((g) => g.select('.domain').remove())
                        .call((g) => g.selectAll('text').attr('x', 6))
                ),
        [height, x]
    );

    function onBrushEnd(event: any) {
        const { selection } = event;
        if (!event.sourceEvent || !selection) return;
        const [x0, x1] = selection.map((d: any) => DAILY_INTERVAL!.round(x.invert(d)));
        // TODO: Limit size to about 3 months. The trick is to call `brush.move()`
        // with the clamped range.
        d3.select<SVGGElement, Date>(brushRef.current!)
            .transition()
            .call(brush.move, x1 > x0 ? [x0, x1].map(x) : null);
        if (onChange) onChange([x0, x1]);
    }

    brush.on('end', onBrushEnd);

    useEffect(() => {
        if (brushRef.current) d3.select<SVGGElement, Date>(brushRef.current).call(brush);
        if (xAxisRef.current) d3.select<SVGGElement, Date>(xAxisRef.current).call(xAxis);
    }, [brush, xAxis]);

    return (
        <svg height={height} width={width} viewBox={`0 0 ${width} ${height}`}>
            <g ref={xAxisRef} transform={`translate(0, ${height - 20})`}></g>
            <g ref={brushRef}></g>
        </svg>
    );
}
