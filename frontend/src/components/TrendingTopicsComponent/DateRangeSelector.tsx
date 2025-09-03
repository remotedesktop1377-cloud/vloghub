import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, useTheme, Typography } from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';
import styles from './css/TrendingTopics.module.css';

export interface DateRangeOption {
    value: string;
    label: string;
    hours: number;
}

export const dateRangeOptions: DateRangeOption[] = [
    { value: '24h', label: 'Past 24 hours', hours: 24 },
    { value: '7d', label: 'Past week', hours: 168 },
    { value: '30d', label: 'Past month', hours: 720 },
    { value: 'any', label: 'Any time', hours: 0 },
];

interface DateRangeSelectorProps {
    selectedDateRange: string;
    onDateRangeChange: (dateRange: string) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
    selectedDateRange,
    onDateRangeChange,
}) => {
    const theme = useTheme();

    const handleDateRangeChange = (event: SelectChangeEvent<string>) => {
        onDateRangeChange(event.target.value);
    };
    
    return (
        <Box className={styles.dateRangeSelectorContainer}>
            <FormControl
                className={styles.dateRangeSelector}
                size="small"
                sx={{
                    height: '40px',
                    width: '160px',
                    minWidth: '160px'
                }}
            >
                <InputLabel id="date-range-label" sx={{ fontSize: '1.05rem', fontWeight: 500 }}>Time Range</InputLabel>
                <Select
                    labelId="date-range-label"
                    value={selectedDateRange}
                    label="Time Range"
                    onChange={handleDateRangeChange}
                    sx={{
                        height: '40px',
                        width: '100%',
                        fontSize: '1.05rem',
                        fontWeight: 500
                    }}
                >
                    {dateRangeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value} sx={{ '& .MuiTypography-root': { fontSize: '1.05rem' } }}>
                            <Box className={styles.dateRangeMenuItem}>
                                <Typography variant="body2" className={styles.dateRangeLabel} sx={{ fontSize: '1.05rem' }}>
                                    {option.label}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default DateRangeSelector;
