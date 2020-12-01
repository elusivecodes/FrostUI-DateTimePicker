/**
 * DateTimePicker (Static)
 */

Object.assign(DateTimePicker, {

    /**
     * Check a locale for day period component (and cache).
     * @param {string} locale The locale to check.
     * @returns {Boolean} Whether the locale uses a day period component.
     */
    checkDayPeriod(locale) {
        if (!(locale in this._dayPeriods)) {
            const formatter = new Intl.DateTimeFormat(locale, {
                hour: '2-digit'
            });

            this._dayPeriods[locale] = !!formatter.formatToParts(new Date)
                .find(part => part.type === 'dayPeriod');
        }

        return this._dayPeriods[locale];
    },

    /**
     * Get the default date format for a locale.
     * @param {string} locale The input locale.
     * @returns {string} The default date format.
     */
    getDefaultDateFormat(locale) {
        if (!(locale in this._defaultDateFormats)) {
            this._defaultDateFormats[locale] = this._formatFromParts(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }

        return this._defaultDateFormats[locale];
    },

    /**
     * Get the default format for a locale.
     * @param {string} locale The input locale.
     * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
     * @returns {string} The default format.
     */
    getDefaultFormat(locale, hasDayPeriod) {
        if (!(locale in this._defaultFormats)) {
            this._defaultFormats[locale] = this._formatFromParts(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }, hasDayPeriod);
        }

        return this._defaultFormats[locale];
    },

    /**
     * Create a date format from a locale and options.
     * @param {string} locale The input locale.
     * @param {object} options Options for the formatter.
     * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
     * @returns {string} The date format.
     */
    _formatFromParts(locale, options, hasDayPeriod) {
        const formatter = new Intl.DateTimeFormat(locale, options);

        return formatter.formatToParts(new Date)
            .map(
                part => {
                    switch (part.type) {
                        case 'year':
                            return 'yyyy';
                        case 'month':
                            return 'MM';
                        case 'day':
                            return 'dd';
                        case 'hour':
                            return hasDayPeriod ?
                                'hh' :
                                'HH';
                        case 'minute':
                            return 'mm';
                        case 'dayPeriod':
                            return 'a';
                    }

                    if (part.value === ', ') {
                        return ' ';
                    }

                    if (!/[a-z]/i.test(part.value)) {
                        return part.value;
                    }

                    return `'${part.value}'`;
                }
            ).join('');
    }

});
