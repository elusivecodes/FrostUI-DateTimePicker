Object.assign(DateTimePicker, {

    _dayPeriods: {},
    _defaultFormats: {},

    checkDayPeriod(locale) {
        if (!(locale in this._dayPeriods)) {
            const formatter = new Intl.DateTimeFormat(locale, {
                hour: '2-digit'
            });

            this._dayPeriods[locale] = formatter.formatToParts(new Date)
                .find(part => part.type === 'dayPeriod');
        }

        return this._dayPeriods[locale];
    },

    getDefaultFormat(locale, hasDayPeriod) {
        if (!(locale in this._defaultFormats)) {
            const formatter = new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            this._defaultFormats[locale] = formatter.formatToParts(new Date).map(
                part => {
                    switch (part.type) {
                        case 'year':
                            return 'yyyy';
                        case 'month':
                            return 'MM';
                        case 'day':
                            return 'dd';
                        case 'hour':
                            return hasDayPeriod ? 'hh' : 'HH';
                        case 'minute':
                            return 'mm';
                        case 'second':
                            return 'ss';
                        default:
                            return part.value === ', ' ?
                                ' ' :
                                `'${part.value}'`;
                    }
                }
            ).join('');
        }

        return this._defaultFormats[locale];
    }

});
