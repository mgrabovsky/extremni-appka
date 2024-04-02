import { useEffect, useMemo, useState } from 'react';

import './App.css';
import datasetUrl from '../data/dataset.json?url';
import { FirstChart } from './charts/FirstChart';
import { SingleDayChart } from './charts/SingleDayChart';
import { DateBrush, DateBrushProps } from './DateBrush';
import { StationList, StationSelector } from './StationSelector';
import { Dataset, datasetSchema, DayExtended } from '../schema';

const chartWidth = 800;
const chartHeight = 700;
const chartMargins = { top: 20, right: 40, bottom: 20, left: 40 };

const METRICS = {
    average: { field: 'avg' as const, plural: 'averages' },
    maximum: { field: 'high' as const, plural: 'maxima' },
    minimum: { field: 'low' as const, plural: 'minima' },
};

type MetricName = keyof typeof METRICS;

const CHART_IDS = ['first', 'single-day'];

interface MetricSelectorProps {
    metric: MetricName;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

function MetricSelector(props: MetricSelectorProps) {
    const { metric, onChange } = props;

    return (
        <select
            className="customSelector"
            name="metric"
            onChange={onChange}
            value={metric}
        >
            {Object.entries(METRICS).map(([singular, { plural }]) => (
                <option key={singular} value={singular}>
                    {plural}
                </option>
            ))}
        </select>
    );
}

interface ChartSelectorProps {
    chart: string;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

function ChartSelector(props: ChartSelectorProps) {
    const { chart: metric, onChange } = props;

    return (
        <select
            className="customSelector"
            name="chartType"
            onChange={onChange}
            value={metric}
        >
            {CHART_IDS.map((id) => (
                <option key={id} value={id}>
                    {id}
                </option>
            ))}
        </select>
    );
}

type DateRange = [Date, Date];

function inRangeInclusive(dateRange: DateRange) {
    const [date0, date1] = dateRange;
    const day0 = date0.getDate();
    const day1 = date1.getDate();
    const month0 = 1 + date0.getMonth();
    const month1 = 1 + date1.getMonth();
    return ({ day, month }: DayExtended) => (
        month0 === month1
            ? (month === month0 && day0 <= day && day <= day1)
            : (
                (month0 < month && month < month1) ||
                (month === month0 && day0 <= day) ||
                (month === month1 && day <= day1)
            )
    );
}

export function App() {
    const [dataset, setDataset] = useState<Dataset>({});
    const [dateRange, setDateRange] = useState<DateRange>([
        new Date(2000, 5, 1),
        new Date(2000, 6, 31),
    ]);
    const [metric, setMetric] = useState<MetricName>('average');
    const [selectedChart, setChart] = useState<string>('first');
    const [selectedStation, setStation] = useState<string>('B2BTUR01');

    useEffect(() => {
        fetch(datasetUrl)
            .then((response) => response.json())
            .then(datasetSchema.parseAsync)
            .then(setDataset);
    }, []);

    const allStations = useMemo<StationList | undefined>(
        () =>
            Object.entries(dataset).map(([stationId, { name }]) => ({
                id: stationId,
                name,
            })),
        [dataset]
    );

    const filtered: DayExtended[] = useMemo(() => {
        if (!Object.keys(dataset).length || !selectedStation) return [];
        return dataset[selectedStation].temps.filter(inRangeInclusive(dateRange));
    }, [dataset, dateRange, selectedStation]);

    // const onMonthChange: MonthSelectorProps['onChange'] = (event) => {
    //     setMonth(Number(event.target.value));
    // };

    const onMetricChange: MetricSelectorProps['onChange'] = (event) => {
        setMetric(event.target.value as MetricName);
    };

    const onDateRangeChange: DateBrushProps['onChange'] = useMemo(
        () =>
            ([x0, x1]) => {
                setDateRange([x0, x1]);
            },
        []
    );

    return (
        <div className="App">
            <h1>
                1961–2021 Temperatures for{' '}
                <StationSelector
                    allStations={allStations}
                    onChange={({ target }) => setStation(target.value)}
                    station={selectedStation}
                />
            </h1>

            <p>
                Chart type:{' '}
                <ChartSelector
                    chart={selectedChart}
                    onChange={({ target }) => setChart(target.value)}
                />
            </p>

            <p>
                Showing temperature{' '}
                <MetricSelector metric={metric} onChange={onMetricChange} /> for{' '}
                {/* <MonthSelector month={month} onChange={onMonthChange} /> */}
            </p>

            {selectedChart === 'first' &&
                ((dataset && (
                    <FirstChart
                        data={filtered}
                        height={chartHeight}
                        margin={chartMargins}
                        metricField={METRICS[metric].field}
                        width={chartWidth}
                    />
                )) || <p>No data.</p>)}
            {selectedChart === 'single-day' &&
                ((dataset && (
                    <SingleDayChart
                        data={filtered}
                        height={chartHeight}
                        margin={chartMargins}
                        metricField={METRICS[metric].field}
                        width={chartWidth}
                    />
                )) || <p>No data.</p>)}

            <DateBrush height={40} onChange={onDateRangeChange} width={chartWidth} />

            <p>
                (Weather data from{' '}
                <a href="https://www.chmi.cz" rel="noreferrer" target="_blank">
                    ČHMÚ
                </a>
                .)
            </p>
        </div>
    );
}
