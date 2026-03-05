import { type ChangeEventHandler } from 'react';

export type StationList = { id: string; name: string }[];

export interface StationSelectorProps {
    allStations?: StationList;
    onChange: ChangeEventHandler<HTMLSelectElement>;
    station: string;
}

export function StationSelector(props: StationSelectorProps) {
    const { allStations, onChange, station } = props;

    if (!allStations || !allStations.length) return <span>Loading stations…</span>;

    return (
        <select
            className="customSelector"
            name="station"
            onChange={onChange}
            value={station}
        >
            {allStations.map(({ id, name }) => (
                <option key={id} value={id}>
                    {name}
                </option>
            ))}
        </select>
    );
}
