import { useMemo } from 'react';

export interface MonthSelectorProps {
    month: number;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

export function MonthSelector(props: MonthSelectorProps) {
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
        <select className="customSelector" name="month" onChange={onChange} value={month}>
            {monthNames.map((name, i) => (
                <option key={i} value={1 + i}>
                    {name}
                </option>
            ))}
        </select>
    );
}
