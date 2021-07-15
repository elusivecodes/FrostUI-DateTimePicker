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
        if (this._minDate && this._minDate.isAfter(date)) {
            date.setTimestamp(this._minDate.getTimestamp());
        }

        if (this._maxDate && this._maxDate.isBefore(date)) {
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
     * @param {string} [granularity=second] The level of granularity to use for comparison.
     * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
     */
    _isAfterMin(date, granularity = 'second') {
        if (this._minDate && date.isBefore(this._minDate, granularity)) {
            return false;
        }

        return true;
    },

    /**
     * Determine whether a date is between min/max dates.
     * @param {DateTime} date The date to test.
     * @param {string} [granularity=second] The level of granularity to use for comparison.
     * @return {Boolean} TRUE if the date is between min/max, otherwise FALSE.
     */
    _isBeforeMax(date, granularity = 'second') {
        if (this._maxDate && date.isAfter(this._maxDate, granularity)) {
            return false;
        }

        return true;
    },

    /**
     * Determine whether a date is a "current" date.
     * @param {DateTime} date The date to test.
     * @param {string} [granularity=day] The level of granularity to use for comparison.
     * @return {Boolean} TRUE if the date is a "current" date, otherwise FALSE.
     */
    _isCurrent(date, granularity = 'day') {
        if (this._settings.multiDate) {
            return !!this._dates.find(currentDate => currentDate.isSame(date, granularity));
        }

        return this._date && this._date.isSame(date, granularity);
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
            default:
                minMaxGranularity = 'second';
                break;
        }

        if (!this._isAfterMin(date, minMaxGranularity)) {
            return false;
        }

        if (!this._isBeforeMax(date, minMaxGranularity)) {
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
            this._viewDate = this._date.clone();
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
     * @param {DateTime} date The input date.
     */
    _setDate(date) {
        if (!this._isEditable()) {
            return;
        }

        if (!this._settings.keepInvalid) {
            this._clampDate(date);
        }

        if (this._formatDate(date) === dom.getValue(this._node)) {
            return;
        }

        if (date) {
            this._viewDate = date.clone();
        }

        dom.triggerEvent(this._node, 'change.ui.datetimepicker', {
            detail: {
                old: this._date ?
                    this._date.clone() :
                    null,
                new: date ?
                    date.clone() :
                    null
            }
        });

        this._date = date;

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

        dates = dates
            .map(date => {
                this._clampDate(date);

                return date;
            })
            .filter((date, index) => {
                for (const [otherIndex, other] of dates.entries()) {
                    if (otherIndex > index && date.isSame(other)) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => a.isBefore(b) ? -1 : 1);

        if (this._formatDates(dates) === dom.getValue(this._node)) {
            return;
        }

        dom.triggerEvent(this._node, 'change.ui.datetimepicker', {
            old: this._dates.map(date => date.clone()),
            new: dates.map(date => date.clone())
        });

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
