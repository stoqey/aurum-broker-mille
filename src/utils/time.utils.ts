import moment from 'moment';

export const formatTimeForLog = (time: Date): string => {
    return moment(time || new Date).format('DD-MM-YYYY, hh:mm:ss');
} 