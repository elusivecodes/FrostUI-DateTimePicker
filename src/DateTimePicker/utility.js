Object.assign(DateTimePicker.prototype, {

    getDate() {
        if (this._settings.multiDate) {
            return this._dates;
        }

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
        if (this._settings.multiDate) {
            this._dates = this._parseDates(date);

            if (!this._settings.keepInvalid) {
                this._dates = this._dates.filter(newDate => this._isValid(newDate, 'second'));
            }

            if (this._dates.length) {
                this._viewDate = this._dates[0].clone();
            }
        } else {
            const newDate = this._parseDate(date);

            if (newDate && !this._settings.keepInvalid && !this._isValid(newDate, 'second')) {
                throw new Error('Invalid date supplied');
            }

            this._currentDate = newDate;

            if (newDate) {
                this._viewDate = newDate.clone();
            }
        }

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
        let value = '';
        if (this._settings.multiDate) {
            value = this._dates
                .sort((a, b) => a.isBefore(b) ? -1 : 1)
                .map(currentDate => currentDate.format(this._settings.format))
                .join(this._settings.multiSeparator);
        } else if (this._currentDate) {
            value = this._currentDate.format(this._settings.format);
        }

        dom.setValue(this._node, value);

        return this;
    }

});
