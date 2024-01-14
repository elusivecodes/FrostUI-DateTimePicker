import DateTime from '@fr0st/datetime';
import $ from '@fr0st/query';
import { isAfterDay, isAfterMonth, isAfterSecond, isAfterYear, isBeforeDay, isBeforeMonth, isBeforeSecond, isBeforeYear, isSameDay, isSameMonth, isSameSecond, isSameYear } from './../comparisons.js';
import { getDefaultTimeFormat } from './../formats.js';

/**
 * Check the format for date and time components.
 */
export function _checkFormat() {
    this._hasYear = false;
    this._hasMonth = false;
    this._hasDate = false;
    this._hasHours = false;
    this._hasMinutes = false;

    const tokens = this._options.format.matchAll(/([a-z])\1*|'[^']*'/ig);
    for (const token of tokens) {
        if (!token[1]) {
            continue;
        }

        switch (token[1]) {
            case 'y':
            case 'Y':
                this._hasYear = true;
                break;
            case 'M':
            case 'L':
                this._hasMonth = true;
                break;
            case 'd':
            case 'D':
                this._hasDate = true;
                break;
            case 'h':
            case 'H':
            case 'K':
            case 'k':
                this._hasHours = true;
                break;
            case 'm':
                this._hasMinutes = true;
                break;
        }
    }

    if (this._hasDate && !this._hasMonth) {
        throw new Error('Date selector requires a month.');
    }

    if (this._hasMonth && !this._hasYear) {
        throw new Error('Month selector requires a year.');
    }

    if (this._hasMinutes && !this._hasHours) {
        throw new Error('Minute selector requires hours.');
    }

    if (this._hasHours && this._hasYear && !this._hasDate) {
        throw new Error('Date/time selector requires a day of month.');
    }

    if (this._hasHours && this._options.multiDate) {
        throw new Error('Time selector cannot be used with multiDate option.');
    }

    if (this._hasDate) {
        this._minView = 'days';
    } else if (this._hasMonth) {
        this._minView = 'months';
    } else if (this._hasYear) {
        this._minView = 'years';
    }
};

/**
 * Clamp a date between min and max dates.
 * @param {DateTime} date The input date.
 * @return {DateTime} The clamped date.
 */
export function _clampDate(date) {
    if (!this._isAfterMin(date)) {
        date = date.setTimestamp(this._minDate.getTimestamp());
    }

    if (!this._isBeforeMax(date)) {
        date = date.setTimestamp(this._maxDate.getTimestamp());
    }

    return date;
};

/**
 * Clamp a date to the nearest stepping interval.
 * @param {DateTime} date The input date.
 * @return {DateTime} The clamped date.
 */
export function _clampStepping(date) {
    if (!this._hasMinutes || this._options.minuteStepping == 1) {
        return date;
    }

    const minutes = date.getMinutes();
    const stepMinutes = Math.min(
        $._toStep(minutes, this._options.minuteStepping),
        60,
    );

    if (minutes !== stepMinutes) {
        return date.setMinutes(stepMinutes);
    }

    return date;
};

/**
 * Format a date.
 * @param {DateTime} [date] The date to format.
 * @return {string} The formatted date.
 */
export function _formatDate(date) {
    if (!date) {
        return '';
    }

    return date.format(this._options.format);
};

/**
 * Format multiple dates.
 * @param {array} [dates] The dates to format.
 * @return {string} The formatted dates.
 */
export function _formatDates(dates) {
    return dates
        .map((date) => date.format(this._options.format))
        .join(this._options.multiDateSeparator);
};

/**
 * Determine whether a date is between min/max dates.
 * @param {DateTime} date The date to test.
 * @param {object} [options] The options for how to compare the dates.
 * @param {string} [options.granularity] The level of granularity to use for comparison.
 * @param {Boolean} [options.allowSame=false] Whether to also allow same check.
 * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
 */
export function _isAfterMin(date, { granularity = null, allowSame = false } = {}) {
    if (!this._minDate) {
        return true;
    }

    switch (granularity) {
        case 'day':
            return (allowSame && isSameDay(date, this._minDate)) || isAfterDay(date, this._minDate);
        case 'month':
            return (allowSame && isSameMonth(date, this._minDate)) || isAfterMonth(date, this._minDate);
        case 'year':
            return (allowSame && isSameYear(date, this._minDate)) || isAfterYear(date, this._minDate);
        default:
            return (allowSame && isSameSecond(date, this._minDate)) || isAfterSecond(date, this._minDate);
    }
};

/**
 * Determine whether a date is between min/max dates.
 * @param {DateTime} date The date to test.
 * @param {object} [options] The options for how to compare the dates.
 * @param {string} [options.granularity] The level of granularity to use for comparison.
 * @param {Boolean} [options.allowSame=false] Whether to also allow same check.
 * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
 */
export function _isBeforeMax(date, { granularity = null, allowSame = false } = {}) {
    if (!this._maxDate) {
        return true;
    }

    switch (granularity) {
        case 'day':
            return (allowSame && isSameDay(date, this._maxDate)) || isBeforeDay(date, this._maxDate);
        case 'month':
            return (allowSame && isSameMonth(date, this._maxDate)) || isBeforeMonth(date, this._maxDate);
        case 'year':
            return (allowSame && isSameYear(date, this._maxDate)) || isBeforeYear(date, this._maxDate);
        default:
            return (allowSame && isSameSecond(date, this._maxDate)) || isBeforeSecond(date, this._maxDate);
    }
};

/**
 * Determine whether a date is a "current" date.
 * @param {DateTime} date The date to test.
 * @param {object} [options] The options for how to compare the dates.
 * @param {string} [options.granularity] The level of granularity to use for comparison.
 * @return {Boolean} TRUE if the date is a "current" date, otherwise FALSE.
 */
export function _isCurrent(date, { granularity = null } = {}) {
    let callback;
    switch (granularity) {
        case 'month':
            callback = isSameMonth;
            break;
        case 'year':
            callback = isSameYear;
            break;
        default:
            callback = isSameDay;
            break;
    }

    if (this._options.multiDate) {
        return !!this._dates.find((currentDate) => callback(date, currentDate));
    }

    return this._date && callback(date, this._date);
};

/**
 * Determine whether the input is editable.
 * @return {Boolean} TRUE if the input is editable, otherwise FALSE.
 */
export function _isEditable() {
    return !$.is(this._node, ':disabled') && (this._options.ignoreReadonly || !$.is(this._node, ':read-only'));
};

/**
 * Determine whether a date is valid.
 * @param {DateTime} date The date to test.
 * @param {object} [options] The options for how to compare the dates.
 * @param {string} [options.granularity=second] The level of granularity to use for comparison.
 * @return {Boolean} TRUE if the date is valid, otherwise FALSE.
 */
export function _isValid(date, { granularity = 'second' } = {}) {
    let minMaxGranularity;
    switch (granularity) {
        case 'year':
        case 'month':
        case 'day':
            minMaxGranularity = granularity;
            break;
    }

    if (!this._isAfterMin(date, { granularity: minMaxGranularity, allowSame: true })) {
        return false;
    }

    if (!this._isBeforeMax(date, { granularity: minMaxGranularity, allowSame: true })) {
        return false;
    }

    if (this._options.isValidYear && !this._options.isValidYear(date)) {
        return false;
    }

    if (granularity === 'year') {
        return true;
    }

    if (this._options.isValidMonth && !this._options.isValidMonth(date)) {
        return false;
    }

    if (granularity === 'month') {
        return true;
    }

    if (this._options.isValidDay && !this._options.isValidDay(date)) {
        return false;
    }

    if (granularity === 'day' || !this._hasHours) {
        return true;
    }

    if (this._options.isValidTime && !this._options.isValidTime(date)) {
        return false;
    }

    return true;
};

/**
 * Create a new DateTime object from format.
 * @param {string} date The date string.
 * @return {DateTime|null} The new DateTime.
 */
export function _makeDate(date) {
    if (date === null) {
        return date;
    }

    date = `${date}`.trim();

    if (date === '') {
        return null;
    }

    const formats = [this._options.format, ...this._options.altFormats];

    for (const format of formats) {
        try {
            const newDate = DateTime.fromFormat(format, date, this._dateOptions);

            if (!newDate.isValid) {
                continue;
            }

            return this._clampStepping(newDate);
        } catch (e) { }
    }

    return null;
};

/**
 * Create a new DateTime object set to the current date/time.
 * @return {DateTime} The new DateTime.
 */
export function _now() {
    return this._clampStepping(DateTime.now(this._dateOptions));
};

/**
 * Parse a DateTime from any value.
 * @param {string|number|array|Date|DateTime} date The date to parse.
 * @return {DateTime} The parsed DateTime.
 */
export function _parseDate(date) {
    if (!date) {
        return null;
    }

    if (date instanceof DateTime) {
        return DateTime.fromTimestamp(
            date.getTimestamp(),
            this._dateOptions,
        );
    }

    if ($._isString(date)) {
        try {
            return this._makeDate(date);
        } catch (e) {
            return new DateTime(date, this._dateOptions);
        }
    }

    if (date instanceof Date) {
        return DateTime.fromDate(date, this._dateOptions);
    }

    if ($._isNumber(date)) {
        return DateTime.fromTimestamp(date, this._dateOptions);
    }

    if ($._isArray(date)) {
        return DateTime.fromArray(date, this._dateOptions);
    }

    return null;
};

/**
 * Parse DateTime objects from an array of values.
 * @param {array} dates The dates to parse.
 * @return {array} An array of parsed DateTime objects.
 */
export function _parseDates(dates) {
    if (!dates) {
        return null;
    }

    return dates
        .map((date) => this._parseDate(date))
        .filter((date) => !!date);
};

/**
 * Refresh the date and time UI elements.
 */
export function _refresh() {
    if (this._options.showToolbar) {
        if (this._date) {
            if (this._hasYear) {
                $.setText(this._toolbarYear, this._date.format('yyyy'));
            }

            if (this._hasDate) {
                $.setText(this._toolbarDate, this._date.format('LLL d'));
            } else if (this._hasMonth) {
                $.setText(this._toolbarDate, this._date.format('LLL'));
            }

            if (this._hasHours) {
                const timeFormat = getDefaultTimeFormat(this._dateOptions.locale, this._useDayPeriod);
                $.setText(this._toolbarTime, this._date.format(timeFormat));
            }
        } else {
            if (this._hasYear) {
                $.setText(this._toolbarYear, '-');
            }

            if (this._hasDate) {
                $.setText(this._toolbarDate, '- -');
            } else if (this._hasMonth) {
                $.setText(this._toolbarDate, '-');
            }

            if (this._hasHours) {
                const timeFormat = this._useDayPeriod ? '-:- -' : '-:-';
                $.setText(this._toolbarTime, timeFormat);
            }
        }
    }

    if (this._hasYear && $.isConnected(this._dateContainer)) {
        this._refreshDate();
    }

    if (this._hasHours && $.isConnected(this._timeContainer)) {
        this._refreshTime();
    }

    if (this._hasYear && this._hasHours && !this._options.sideBySide && this._isEditable()) {
        const showDate = $.findOne('[data-ui-action="showDate"]', this._showDateTable);
        const showTime = $.findOne('[data-ui-action="showTime"]', this._showTimeTable);

        $.setAttribute(showDate, { tabindex: 0 });
        $.setAttribute(showTime, { tabindex: 0 });
    }
};

/**
 * Refresh the date container.
 */
export function _refreshDate() {
    $.empty(this._dateContainer);

    switch (this._viewMode) {
        case 'years':
            this._renderYears();
            break;
        case 'months':
            this._renderMonths();
            break;
        case 'days':
            this._renderDays();
            break;
    }

    if (this._hasHours && !this._options.sideBySide) {
        if (this._options.modal) {
            $.prepend(this._dateContainer, this._showTimeTable);
        } else {
            $.append(this._dateContainer, this._showTimeTable);
        }
    }

    if (this._options.showClose && !this._options.modal && !this._options.inline && !this._hasHours) {
        $.append(this._dateContainer, this._closeTable);
    }

    if (!this._isEditable()) {
        const focusableNodes = $.find('[tabindex]', this._dateContainer);
        $.setAttribute(focusableNodes, { tabindex: -1 });
    }

    this.update();

    $.triggerEvent(this._node, 'refresh.ui.datetimepicker', {
        detail: {
            view: 'date',
            viewMode: this._viewMode,
            viewDate: this._viewDate,
        },
    });
};

/**
 * Refresh the toggle disabled.
 */
export function _refreshDisabled() {
    if ($.is(this._node, ':disabled')) {
        $.addClass(this._menuNode, this.constructor.classes.disabled);
    } else {
        $.removeClass(this._menuNode, this.constructor.classes.disabled);
    }
};

/**
 * Refresh the time container.
 */
export function _refreshTime() {
    $.empty(this._timeContainer);

    if (this._hasDate && !this._options.sideBySide) {
        $.append(this._timeContainer, this._showDateTable);
    }

    switch (this._timeViewMode) {
        case 'hours':
            this._renderHours();
            break;
        case 'minutes':
            this._renderMinutes();
            break;
        default:
            this._renderTime();
            break;
    }

    if (this._options.showClose && !this._options.modal && !this._options.inline) {
        $.append(this._timeContainer, this._closeTable);
    }

    if (!this._isEditable()) {
        const focusableNodes = $.find('[tabindex]', this._timeContainer);
        $.setAttribute(focusableNodes, { tabindex: -1 });
    }

    this.update();

    $.triggerEvent(this._node, 'refresh.ui.datetimepicker', {
        detail: {
            view: 'time',
            viewMode: this._timeViewMode,
            viewDate: this._viewDate,
        },
    });
};

/**
 * Reset the view.
 */
export function _resetView() {
    this._viewMode = this._minView;
    this._timeViewMode = null;

    if (this._options.multiDate && this._dates.length) {
        this._viewDate = this._dates[0];
    } else if (this._date) {
        this._viewDate = this._date;
    } else {
        this._viewDate = this._defaultDate;
    }

    if (this._hasDate && this._hasHours && !this._options.sideBySide) {
        $.detach(this._timeContainer);
        $.append(this._container, this._dateContainer);
    }
};

/**
 * Set the current date.
 * @param {DateTime|null} [date] The input date.
 * @param {object} options The options for setting the date.
 * @param {Boolean} [options.updateValue=true] Whether to update the value.
 */
export function _setDate(date, { updateValue = true } = {}) {
    if (!this._isEditable()) {
        return;
    }

    if (date) {
        date = this._clampStepping(date);
    }

    if (date && !this._isValid(date)) {
        date = null;
    }

    const oldDate = this._date;
    this._date = date;

    this._refresh();

    const oldValue = $.getValue(this._node);
    const newValue = this._formatDate(date);

    if (!updateValue || oldValue === newValue) {
        return;
    }

    this._updateValue();

    $.triggerEvent(this._node, 'change.ui.datetimepicker', {
        data: {
            skipUpdate: true,
        },
        detail: {
            old: oldDate,
            new: this._date,
        },
    });
};

/**
 * Set the current dates.
 * @param {array} dates The input dates.
 * @param {object} options The options for setting the date.
 * @param {Boolean} [options.updateValue=true] Whether to update the value.
 */
export function _setDates(dates, { updateValue = true } = {}) {
    if (!this._isEditable()) {
        return;
    }

    dates = dates
        .filter((date) => this._isValid(date))
        .sort((a, b) => isBeforeSecond(a, b) ? -1 : 1);

    const oldDates = this._dates;
    this._dates = dates;

    this._refresh();

    const oldValue = $.getValue(this._node);
    const newValue = this._formatDates(dates);

    if (!updateValue || oldValue === newValue) {
        return;
    }

    this._updateValue();

    $.triggerEvent(this._node, 'change.ui.datetimepicker', {
        data: {
            skipUpdate: true,
        },
        detail: {
            old: oldDates,
            new: this._dates.slice(),
        },
    });
};

/**
 * Update the input value to the current date.
 */
export function _updateValue() {
    let value;
    if (this._options.multiDate) {
        value = this._formatDates(this._dates);
    } else {
        value = this._formatDate(this._date);
    }

    $.setValue(this._node, value);
};
