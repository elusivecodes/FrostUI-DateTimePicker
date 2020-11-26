Object.assign(DateTimePicker.prototype, {

    disableDates(disabledDates) {
        this._disabledDates = this._parseDates(disabledDates);
        this._enabledDates = null;

        this.update();
        this.refresh();

        return this;
    },

    disableDays(disabledDays) {
        this._disabledDays = disabledDays;
        this._enabledDays = null;

        this.update();
        this.refresh();

        return this;
    },

    disableHours(disabledHours) {
        this._disabledHours = disabledHours;
        this._enabledHours = null;

        this.update();
        this.refresh();

        return this;
    },

    // disableTimeIntervals() {
    //     this._disabledTimeIntervals = disabledTimeIntervals;

    //     this.update();
    //     this.refresh();

    //     return this;
    // },

    enableDates(enabledDates) {
        this._enabledDates = this._parseDates(enabledDates);
        this._disabledDates = null;

        this.update();
        this.refresh();

        return this;
    },

    enableDays(enabledDays) {
        this._enabledDays = enabledDays;
        this._disabledDays = null;

        this.update();
        this.refresh();

        return this;
    },

    enableHours(enabledHours) {
        this._enabledHours = enabledHours;
        this._disabledDays = null;

        this.update();
        this.refresh();

        return this;
    },

    maxDate(maxDate) {
        this._maxDate = this._parseDate(maxDate);

        this.update();
        this.refresh();

        return this;
    },

    minDate(minDate) {
        this._minDate = this._parseDate(minDate);

        this.update();
        this.refresh();

        return this;
    },

    getDate() {
        return this._currentDate.clone();
    },

    setDate(date) {
        this._currentDate = this._parseDate(date);

        this.update();
        this.refresh();

        return this;
    },

    update() {
        if (!this._currentDate) {
            return this;
        }

        if (this._minDate && this._currentDate.isBefore(this._minDate)) {
            this._currentDate = this._minDate.clone();
        }

        if (this._maxDate && this._currentDate.isAfter(this._maxDate)) {
            this._currentDate = this._maxDate.clone();
        }

        const dateString = this._currentDate.format(this._settings.format);
        dom.setValue(
            this._node,
            dateString
        );

        return this;
    },

    viewDate(viewDate) {
        this._viewDate = this._parseDate(viewDate);

        this.refresh();

        return this;
    }

});
