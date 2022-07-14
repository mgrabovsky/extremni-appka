import { useEffect, useState } from 'react';

import { FirstChart } from './components/charts/FirstChart';
import { SingleDayChart } from './components/charts/SingleDayChart';
import { Dataset, datasetSchema, DayExtended } from './Schema';
import { MonthSelector, MonthSelectorProps } from './components/MonthSelector';
import { StationList, StationSelector } from './components/StationSelector';
import './App.css';

const chartWidth = 800;
const chartHeight = 700;
const chartMargins = { top: 20, right: 40, bottom: 20, left: 40 };

const METRICS = {
    average: { field: 'avg', plural: 'averages' },
    maximum: { field: 'high', plural: 'maxima' },
    minimum: { field: 'low', plural: 'minima' },
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

export function App() {
    const [dataset, setDataset] = useState<Dataset>({});
    const [filtered, setFiltered] = useState<DayExtended[]>([]);
    const [month, setMonth] = useState(1);
    const [metric, setMetric] = useState<MetricName>('average');
    const [selectedChart, setChart] = useState<string>('first');
    const [allStations, setAllStations] = useState<StationList>();
    const [selectedStation, setStation] = useState<string>('B2BTUR01');

    useEffect(() => {
        fetch(`${process.env.PUBLIC_URL}/dataset.json`)
            .then((response) => response.json())
            .then(datasetSchema.parseAsync)
            .then((dataset) => {
                setDataset(dataset);
                setAllStations(
                    Object.entries(dataset).map(([stationId, { name }]) => ({
                        id: stationId,
                        name,
                    }))
                );
            });
    }, []);

    useEffect(() => {
        if (!Object.keys(dataset).length || !selectedStation) return;
        setFiltered(dataset[selectedStation].temps.filter((d) => d.month === month));
    }, [dataset, month, selectedStation]);

    const onMonthChange: MonthSelectorProps['onChange'] = (event) => {
        setMonth(Number(event.target.value));
    };

    const onMetricChange: MetricSelectorProps['onChange'] = (event) => {
        setMetric(event.target.value as MetricName);
    };

    return (
        <div className="App">
            <h1>
                1961–2019 Temperatures for{' '}
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
                <MonthSelector month={month} onChange={onMonthChange} />
            </p>

            {selectedChart === 'first' &&
                ((dataset && (
                    <FirstChart
                        data={filtered}
                        height={chartHeight}
                        metricField={METRICS[metric].field as 'avg' | 'high' | 'low'}
                        margin={chartMargins}
                        width={chartWidth}
                    />
                )) || <p>No data.</p>)}
            {selectedChart === 'single-day' &&
                ((dataset && (
                    <SingleDayChart
                        data={filtered}
                        height={chartHeight}
                        metricField={METRICS[metric].field as 'avg' | 'high' | 'low'}
                        margin={chartMargins}
                        width={chartWidth}
                    />
                )) || <p>No data.</p>)}

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
