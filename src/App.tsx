import { useEffect, useMemo, useState } from 'react';

import { MainChart } from './charts/MainChart';
import { Dataset, datasetSchema } from './Schema';
import './App.css';

const chartWidth = 800;
const chartHeight = 700;
const chartMargins = { top: 20, right: 40, bottom: 20, left: 40 };

interface MonthSelectorProps {
    month: number;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

function MonthSelector(props: MonthSelectorProps) {
    const { month, onChange } = props;
    const monthNames = useMemo(
        () =>
            Array(12)
                .fill(null)
                .map((_nothing, i) =>
                    new Date(1970, i, 1).toLocaleString(navigator.language, {
                        month: 'long',
                    })
                ),
        []
    );

    return (
        <select className="monthSelector" name="months" onChange={onChange} value={month}>
            {monthNames.map((name, i) => (
                <option key={i} value={1 + i}>
                    {name}
                </option>
            ))}
        </select>
    );
}

const METRICS = {
    average: { field: 'avg', plural: 'averages' },
    maximum: { field: 'high', plural: 'maxima' },
    minimum: { field: 'low', plural: 'minima' },
};

type MetricName = keyof typeof METRICS;

interface MetricSelectorProps {
    metric: MetricName;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

function MetricSelector(props: MetricSelectorProps) {
    const { metric, onChange } = props;

    return (
        <select
            className="metricSelector"
            name="metrics"
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

export function App() {
    const [dataset, setDataset] = useState<Dataset>([]);
    const [filtered, setFiltered] = useState<Dataset>([]);
    const [month, setMonth] = useState(1);
    const [metric, setMetric] = useState<MetricName>('average');

    useEffect(() => {
        fetch(`${process.env.PUBLIC_URL}/turany2019.json`)
            .then((response) => response.json())
            .then(datasetSchema.parseAsync)
            .then(setDataset);
    }, []);

    useEffect(() => {
        if (!dataset.length) return;
        setFiltered(dataset.filter((d) => d.month === month));
    }, [dataset, month]);

    const onMonthChange: MonthSelectorProps['onChange'] = (event) => {
        setMonth(Number(event.target.value));
    };

    const onMetricChange: MetricSelectorProps['onChange'] = (event) => {
        setMetric(event.target.value as MetricName);
    };

    return (
        <div className="App">
            <h1>1961–2019 Temperatures for Brno-Tuřany</h1>

            <p>
                Showing temperature{' '}
                <MetricSelector metric={metric} onChange={onMetricChange} /> for{' '}
                <MonthSelector month={month} onChange={onMonthChange} />
            </p>

            {(dataset && (
                <MainChart
                    data={filtered}
                    height={chartHeight}
                    metricField={METRICS[metric].field as 'avg' | 'high' | 'low'}
                    margin={chartMargins}
                    width={chartWidth}
                />
            )) || <p>No data.</p>}

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
