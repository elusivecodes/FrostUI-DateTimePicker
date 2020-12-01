/**
 * DateTimePicker Utility
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
     * Get the disabled dates.
     * @return {array} The disabled dates.
     */
    getDisabledDates() {
        if (!this._disabledDates) {
            return null;
        }

        return this._disabledDates.map(date => date.clone());
    },

    /**
     * Get the disabled days.
     * @return {array} The disabled days.
     */
    getDisabledDays() {
        if (!this._disabledDays) {
            return null;
        }

        return this._disabledDays.slice();
    },

    /**
     * Get the disabled hours.
     * @return {array} The disabled hours.
     */
    getDisabledHours() {
        if (!this._disabledHours) {
            return null;
        }

        return this._disabledHours.slice();
    },

    /**
     * Get the disabled time intervals.
     * @return {array} The disabled time intervals.
     */
    getDisabledTimeIntervals() {
        if (!this._disabledTimeIntervals) {
            return null;
        }

        return this._disabledTimeIntervals.map(interval => interval.map(date => date.clone()));
    },

    /**
     * Get the enabled dates.
     * @return {array} The enabled dates.
     */
    getEnabledDates() {
        if (!this._enabledDates) {
            return null;
        }

        return this._enabledDates.map(date => date.clone());
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
            date = this._parseDates(date);
        } else {
            date = this._parseDate(date);
        }

        this._setDate(date);

        return this;
    },

    /**
     * Set the disabled dates.
     * @param {array} disabledDates The input dates.
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setDisabledDates(disabledDates) {
        this._disabledDates = this._parseDates(disabledDates);
        this._enabledDates = null;

        this._update();
        this.refresh();

        return this;
    },

    /**
     * Set the disabled days.
     * @param {number[]} disabledDays The input days.
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setDisabledDays(disabledDays) {
        this._disabledDays = disabledDays;

        this._update();
        this.refresh();

        return this;
    },

    /**
     * Set the disabled hours.
     * @param {number[]} disabledHours The input hours.
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setDisabledHours(disabledHours) {
        this._disabledHours = disabledHours;

        this._update();
        this.refresh();

        return this;
    },

    /**
     * Set the disabled time intervals.
     * @param {array} disabledTimeIntervals The input intervals.
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setDisabledTimeIntervals(disabledTimeIntervals) {
        this._disabledTimeIntervals = disabledTimeIntervals.map(
            intervals => this._parseDates(intervals)
        ).filter(intervals => intervals && intervals.length === 2);

        this._update();
        this.refresh();

        return this;
    },

    /**
     * Set the enabled dates.
     * @param {array} enabledDates The input dates.
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setEnabledDates(enabledDates) {
        this._enabledDates = this._parseDates(enabledDates);
        this._disabledDates = null;

        this._update();
        this.refresh();

        return this;
    },

    /**
     * Set the maximum date.
     * @param {string|number|array|Date|DateTime} date The input date(s).
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setMaxDate(maxDate) {
        this._maxDate = this._parseDate(maxDate);

        this._update();
        this.refresh();

        return this;
    },

    /**
     * Set the minimum date.
     * @param {string|number|array|Date|DateTime} date The input date(s).
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setMinDate(minDate) {
        this._minDate = this._parseDate(minDate);

        this._update();
        this.refresh();

        return this;
    },

    /**
     * Set the view date.
     * @param {string|number|array|Date|DateTime} date The input date(s).
     * @returns {DateTimePicker} The DateTimePicker object.
     */
    setViewDate(viewDate) {
        this._viewDate = this._parseDate(viewDate);

        this.refresh();

        return this;
    }

});
