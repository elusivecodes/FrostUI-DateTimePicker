/**
 * DateTimePicker API
 */

Object.assign(DateTimePicker.prototype, {

    /**
     * Get the current date(s).
     * @return {DateTime|array} The current date(s).
     */
    getDate() {
        if (this._settings.multiDate) {
            return this._dates;
        }

        if (!this._date) {
            return null;
        }

        return this._date.clone();
    },

    /**
     * Get the maximum date.
     * @return {DateTime|array} The maximum date.
     */
    getMaxDate() {
        if (!this._maxDate) {
            return null;
        }

        return this._maxDate.clone();
    },

    /**
     * Get the minimum date.
     * @return {DateTime|array} The minimum date.
     */
    getMinDate() {
        if (!this._minDate) {
            return null;
        }

        return this._minDate.clone();
    },

    /**
     * Get the view date.
     * @return {DateTime} The view date.
     */
    getViewDate() {
        return this._viewDate.clone();
    },

    /**
     * Set the current date(s).
     * @param {string|number|array|Date|DateTime} date The input date(s).
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setDate(date) {
        if (this._settings.multiDate) {
            const dates = this._parseDates(date);
            this._setDates(dates);
        } else {
            date = this._parseDate(date);
            this._setDate(date);
        }

        return this;
    },

    /**
     * Set the maximum date.
     * @param {string|number|array|Date|DateTime} date The input date(s).
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setMaxDate(maxDate) {
        this._maxDate = this._parseDate(maxDate);

        this._updateValue();
        this._refresh();

        return this;
    },

    /**
     * Set the minimum date.
     * @param {string|number|array|Date|DateTime} date The input date(s).
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setMinDate(minDate) {
        this._minDate = this._parseDate(minDate);

        this._updateValue();
        this._refresh();

        return this;
    },

    /**
     * Set the view date.
     * @param {string|number|array|Date|DateTime} date The input date(s).
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setViewDate(viewDate) {
        this._viewDate = this._parseDate(viewDate);

        this._refresh();

        return this;
    }

});
