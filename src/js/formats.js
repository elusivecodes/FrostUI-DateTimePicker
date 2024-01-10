const dayPeriods = {};
const defaultFormats = {};
const defaultDateFormats = {};
const defaultTimeFormats = {};

/**
 * Check a locale for day period component (and cache).
 * @param {string} locale The locale to check.
 * @return {Boolean} Whether the locale uses a day period component.
 */
export function checkDayPeriod(locale) {
    if (!(locale in dayPeriods)) {
        const formatter = new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
        });

        dayPeriods[locale] = !!formatter.formatToParts(new Date)
            .find((part) => part.type === 'dayPeriod');
    }

    return dayPeriods[locale];
};

/**
 * Get the default date format for a locale.
 * @param {string} locale The input locale.
 * @return {string} The default date format.
 */
export function getDefaultDateFormat(locale) {
    if (!(locale in defaultDateFormats)) {
        defaultDateFormats[locale] = formatFromParts(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }

    return defaultDateFormats[locale];
};

/**
 * Get the default format for a locale.
 * @param {string} locale The input locale.
 * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
 * @return {string} The default format.
 */
export function getDefaultFormat(locale, hasDayPeriod) {
    if (!(locale in defaultFormats)) {
        defaultFormats[locale] = formatFromParts(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }, hasDayPeriod);
    }

    return defaultFormats[locale];
};

/**
 * Get the default time format for a locale.
 * @param {string} locale The input locale.
 * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
 * @return {string} The default time format.
 */
export function getDefaultTimeFormat(locale, hasDayPeriod) {
    if (!(locale in defaultTimeFormats)) {
        defaultTimeFormats[locale] = formatFromParts(locale, {
            hour: '2-digit',
            minute: '2-digit',
        }, hasDayPeriod);
    }

    return defaultTimeFormats[locale];
};

/**
 * Create a date format from a locale and options.
 * @param {string} locale The input locale.
 * @param {object} options Options for the formatter.
 * @param {Boolean} hasDayPeriod Whether the locale uses a dayPeriod.
 * @return {string} The date format.
 */
function formatFromParts(locale, options, hasDayPeriod) {
    const formatter = new Intl.DateTimeFormat(locale, options);

    return formatter.formatToParts(new Date)
        .map(
            (part) => {
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
            },
        ).join('');
};
