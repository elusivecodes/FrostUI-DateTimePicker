Object.assign(DateTimePicker.prototype, {

    getDate() {
        if (!this._currentDate) {
            return null;
        }

        return this._currentDate.clone();
    },

    getDisabledDates() {
        return this._disabledDates;
    },

    getDisabledDays() {
        return this._disabledDays;
    },

    getDisabledHours() {
        return this._disabledHours;
    },

    getDisabledTimeIntervals() {
        return this._disabledTimeIntervals;
    },

    getEnabledDates() {
        return this._enabledDates;
    },

    setDate(date) {
        this._currentDate = this._parseDate(date);

        this.update();
        this.refresh();

        return this;
    },

    setDisabledDates(disabledDates) {
        this._disabledDates = this._parseDates(disabledDates);
        this._enabledDates = null;

        this.update();
        this.refresh();

        return this;
    },

    setDisabledDays(disabledDays) {
        this._disabledDays = disabledDays;

        this.update();
        this.refresh();

        return this;
    },

    setDisabledHours(disabledHours) {
        this._disabledHours = disabledHours;

        this.update();
        this.refresh();

        return this;
    },

    setDisabledTimeIntervals() {
        this._disabledTimeIntervals = disabledTimeIntervals;

        this.update();
        this.refresh();

        return this;
    },

    setEnabledDates(enabledDates) {
        this._enabledDates = this._parseDates(enabledDates);
        this._disabledDates = null;

        this.update();
        this.refresh();

        return this;
    },

    setMaxDate(maxDate) {
        this._maxDate = this._parseDate(maxDate);

        this.update();
        this.refresh();

        return this;
    },

    setMinDate(minDate) {
        this._minDate = this._parseDate(minDate);

        this.update();
        this.refresh();

        return this;
    },

    setViewDate(viewDate) {
        this._viewDate = this._parseDate(viewDate);

        this.refresh();

        return this;
    },

    update() {
        if (!this._currentDate) {
            return this;
        }

        dom.setValue(
            this._node,
            this._currentDate.format(this._settings.format)
        );

        return this;
    }

});
