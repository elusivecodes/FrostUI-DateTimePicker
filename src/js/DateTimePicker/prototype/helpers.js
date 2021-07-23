/**
 * DateTimePicker Helpers
 */

Object.assign(DateTimePicker.prototype, {

    /**
     * Check the format for date and time components.
     */
    _checkFormat() {
        const tokens = this._settings.format.matchAll(this.constructor._formatTokenRegExp);
        for (const token of tokens) {
            if (!token[1]) {
                continue;
            }

            switch (token[1]) {
                case 'G':
                case 'y':
                case 'Y':
                case 'q':
                case 'Q':
                case 'M':
                case 'L':
                case 'w':
                case 'W':
                case 'd':
                case 'D':
                case 'F':
                case 'E':
                case 'e':
                case 'c':
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
                case 's':
                    this._hasSeconds = true;
                    break;
            }
        }

        this._hasTime = this._hasHours || this._hasMinutes || this._hasSeconds;

        if (this._settings.multiDate && this._hasTime) {
            throw new Error('Time components cannot be used with multiDate option.');
        }
    },

    /**
     * Clamp a date between min and max dates.
     * @param {DateTime} date The input date.
     */
    _clampDate(date) {
        if (!this._isAfterMin(date)) {
            date.setTimestamp(this._minDate.getTimestamp());
        }

        if (!this._isBeforeMax(date)) {
            date.setTimestamp(this._maxDate.getTimestamp());
        }
    },

    /**
     * Clamp a date to the nearest stepping interval.
     * @param {DateTime} date The input date.
     */
    _clampStepping(date) {
        const minutes = date.getMinutes();
        const stepMinutes = Math.min(
            Core.toStep(minutes, this._settings.stepping),
            60
        );

        if (minutes !== stepMinutes) {
            date.setMinutes(stepMinutes);
        }

        if (this._settings.stepping > 1) {
            date.setSeconds(0);
        }
    },

    /**
     * Format a date.
     * @param {DateTime} [date] The date to format.
     * @returns The formatted date.
     */
    _formatDate(date) {
        if (!date) {
            return '';
        }

        return date.format(this._settings.format);
    },

    /**
     * Format multiple dates.
     * @param {array} [dates] The dates to format.
     * @returns The formatted dates.
     */
    _formatDates(dates) {
        return dates
            .map(date => date.format(this._settings.format))
            .join(this._settings.multiDateSeparator);
    },

    /**
     * Determine whether a date is between min/max dates.
     * @param {DateTime} date The date to test.
     * @param {string} [granularity] The level of granularity to use for comparison.
     * @param {Boolean} [allowSame=false] Whether to also allow same check.
     * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
     */
    _isAfterMin(date, granularity, allowSame = false) {
        if (!this._minDate) {
            return true;
        }

        switch (granularity) {
            case 'day':
                return (allowSame && this.constructor._isSameDay(date, this._minDate)) ||
                    this.constructor._isAfterDay(date, this._minDate);
            case 'month':
                return (allowSame && this.constructor._isSameMonth(date, this._minDate)) ||
                    this.constructor._isAfterMonth(date, this._minDate);
            case 'year':
                return (allowSame && this.constructor._isSameYear(date, this._minDate)) ||
                    this.constructor._isAfterYear(date, this._minDate);
            default:
                return (allowSame && this.constructor._isSameSecond(date, this._minDate)) ||
                    this.constructor._isAfterSecond(date, this._minDate);
        }
    },

    /**
     * Determine whether a date is between min/max dates.
     * @param {DateTime} date The date to test.
     * @param {string} [granularity] The level of granularity to use for comparison.
     * @param {Boolean} [allowSame=false] Whether to also allow same check.
     * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
     */
    _isBeforeMax(date, granularity, allowSame = false) {
        if (!this._maxDate) {
            return true;
        }

        switch (granularity) {
            case 'day':
                return (allowSame && this.constructor._isSameDay(date, this._maxDate)) ||
                    this.constructor._isBeforeDay(date, this._maxDate);
            case 'month':
                return (allowSame && this.constructor._isSameMonth(date, this._maxDate)) ||
                    this.constructor._isBeforeMonth(date, this._maxDate);
            case 'year':
                return (allowSame && this.constructor._isSameYear(date, this._maxDate)) ||
                    this.constructor._isBeforeYear(date, this._maxDate);
            default:
                return (allowSame && this.constructor._isSameSecond(date, this._maxDate)) ||
                    this.constructor._isBeforeSecond(date, this._maxDate);
        }
    },

    /**
     * Determine whether a date is a "current" date.
     * @param {DateTime} date The date to test.
     * @param {string} [granularity] The level of granularity to use for comparison.
     * @return {Boolean} TRUE if the date is a "current" date, otherwise FALSE.
     */
    _isCurrent(date, granularity) {
        let method;
        switch (granularity) {
            case 'month':
                method = '_isSameMonth';
                break;
            case 'year':
                method = '_isSameYear';
                break;
            default:
                method = '_isSameDay';
                break;
        }

        if (this._settings.multiDate) {
            return !!this._dates.find(currentDate => this.constructor[method](date, currentDate));
        }

        return this._date && this.constructor[method](date, this._date);
    },

    /**
     * Determine whether the input is editable.
     * @returns {Boolean} TRUE if the input is editable, otherwise FALSE.
     */
    _isEditable() {
        return !dom.is(this._node, ':disabled') && (this._settings.ignoreReadonly || !dom.is(this._node, ':read-only'));
    },

    /**
     * Determine whether a date is valid.
     * @param {DateTime} date The date to test.
     * @param {string} [granularity=second] The level of granularity to use for comparison.
     * @return {Boolean} TRUE if the date is valid, otherwise FALSE.
     */
    _isValid(date, granularity = 'second') {
        let minMaxGranularity;
        switch (granularity) {
            case 'year':
            case 'month':
            case 'day':
                minMaxGranularity = granularity;
                break;
        }

        if (!this._isAfterMin(date, minMaxGranularity, true)) {
            return false;
        }

        if (!this._isBeforeMax(date, minMaxGranularity, true)) {
            return false;
        }

        if (this._settings.isValidYear && !this._settings.isValidYear(date)) {
            return false;
        }

        if (granularity === 'year') {
            return true;
        }

        if (this._settings.isValidMonth && !this._settings.isValidMonth(date)) {
            return false;
        }

        if (granularity === 'month') {
            return true;
        }

        if (this._settings.isValidDay && !this._settings.isValidDay(date)) {
            return false;
        }

        if (granularity === 'day' || !this._hasTime) {
            return true;
        }

        if (this._settings.isValidTime && !this._settings.isValidTime(date)) {
            return false;
        }

        return true;
    },

    /**
     * Create a new DateTime object from format.
     * @returns {DateTime|null} The new DateTime.
     */
    _makeDate(date) {
        try {
            return DateTime.fromFormat(this._settings.format, date, this._dateOptions);
        } catch (e) {
            return null;
        }
    },

    /**
     * Create a new DateTime object set to the current date/time.
     * @returns {DateTime} The new DateTime.
     */
    _now() {
        return DateTime.now(this._dateOptions);
    },

    /**
     * Parse a DateTime from any value.
     * @param {string|number|array|Date|DateTime} date The date to parse.
     * @return {DateTime} The parsed DateTime.
     */
    _parseDate(date) {
        if (!date) {
            return null;
        }

        if (date instanceof DateTime) {
            return DateTime.fromTimestamp(
                date.getTimestamp(),
                this._dateOptions
            );
        }

        if (Core.isString(date)) {
            try {
                return this._makeDate(date);
            } catch (e) {
                return new DateTime(date, this._dateOptions);
            }
        }

        if (date instanceof Date) {
            return DateTime.fromDate(date, this._dateOptions);
        }

        if (Core.isNumber(date)) {
            return DateTime.fromTimestamp(date, this._dateOptions);
        }

        if (Core.isArray(date)) {
            return DateTime.fromArray(date, this._dateOptions);
        }

        return null;
    },


    /**
     * Parse DateTime objects from an array of values.
     * @param {array} dates The dates to parse.
     * @return {array} An array of parsed DateTime objects.
     */
    _parseDates(dates) {
        if (!dates) {
            return null;
        }

        return dates
            .map(date => this._parseDate(date))
            .filter(date => !!date);
    },

    /**
     * Parse settings.
     */
    _parseSettings() {
        switch (this._settings.minView) {
            case 'years':
                this._viewMode = 'years';
                break;
            case 'months':
                this._viewMode = 'months';
                break;
            default:
                this._viewMode = 'days';
                break;
        }

        const value = dom.getValue(this._node);
        if (value) {
            if (this._settings.multiDate) {
                this._dates = value.split(this._settings.multiDateSeparator).map(val => this._makeDate(val));
            } else {
                this._date = this._makeDate(value);
            }
        }

        if (!this._date && this._settings.defaultDate) {
            this._date = this._parseDate(this._settings.defaultDate);
        }

        if (!this._date && this._settings.useCurrent) {
            this._date = this._now();
        }

        if (this._settings.multiDate && this._date) {
            this._dates.push(this._date);
            this._date = null;
        }

        if (this._settings.minDate) {
            this._minDate = this._parseDate(this._settings.minDate);
        }

        if (this._settings.maxDate) {
            this._maxDate = this._parseDate(this._settings.maxDate);
        }

        if (this._settings.viewDate) {
            this._viewDate = this._parseDate(this._settings.viewDate);
        }

        if (!this._viewDate && this._date) {
            this._viewDate = this.getDate();
        }

        if (!this._viewDate) {
            this._viewDate = this._now();
        }
    },

    /**
     * Refresh the toggle disabled.
     */
    _refreshDisabled() {
        if (this._native) {
            return;
        }

        if (dom.is(this._node, ':disabled')) {
            dom.addClass(this._menuNode, this.constructor.classes.disabled);
        } else {
            dom.removeClass(this._menuNode, this.constructor.classes.disabled);
        }
    },

    /**
     * Set the current date.
     * @param {DateTime|null} [date] The input date.
     */
    _setDate(date) {
        if (!this._isEditable()) {
            return;
        }

        if (date) {
            this._clampDate(date);
        }

        if (!this._settings.keepInvalid && date && !this._isValid(date)) {
            date = null;
        }

        if (this._formatDate(date) === dom.getValue(this._node)) {
            return this._refresh();
        }

        this._noChange = true;

        dom.triggerEvent(this._node, 'change.ui.datetimepicker', {
            detail: {
                old: this.getDate(),
                new: date ? date.clone() : null
            }
        });

        this._noChange = false;
        this._date = date;

        if (this._date) {
            this._viewDate = this.getDate();
        }

        this._updateValue();
        this._refresh();
    },

    /**
     * Set the current dates.
     * @param {array} date The input dates.
     */
    _setDates(dates) {
        if (!this._isEditable()) {
            return;
        }

        if (!this._settings.keepInvalid) {
            dates = dates.filter(date => this._isValid(date));
        }

        if (this._formatDates(dates) === dom.getValue(this._node)) {
            return this._refresh();
        }

        this._noChange = true;

        dom.triggerEvent(this._node, 'change.ui.datetimepicker', {
            old: this.getDate(),
            new: dates.map(date => date.clone())
        });

        this._noChange = false;
        this._dates = dates;

        this._updateValue();
        this._refresh();
    },

    /**
     * Update the input value to the current date.
     */
    _updateValue() {
        let value;
        if (this._settings.multiDate) {
            value = this._formatDates(this._dates);
        } else {
            value = this._formatDate(this._date);
        }

        dom.setValue(this._node, value);

        if (this._native && this._date) {
            this._updateNativeDate();
        }

        return this;
    }

});
