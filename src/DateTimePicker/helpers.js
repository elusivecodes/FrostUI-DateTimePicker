Object.assign(DateTimePicker.prototype, {

    _checkFormat() {
        this._hasDate = false;
        this._hasTime = false;

        const tokens = this._settings.format.matchAll(this.constructor._formatTokenRegExp);
        for (const token of tokens) {
            if (!token[1]) {
                continue;
            }

            if (!this._hasDate && this.constructor._dateTokenRegExp.test(token[1])) {
                this._hasDate = true;
            }

            if (!this._hasTime && this.constructor._timeTokenRegExp.test(token[1])) {
                this._hasTime = true;
            }

            if (this._hasDate && this._hasTime) {
                break;
            }
        }
    },

    _isDateBetween(date, scope = 'second') {
        if (this._minDate && date.isBefore(this._minDate, scope)) {
            return false;
        }

        if (this._maxDate && date.isAfter(this._maxDate, scope)) {
            return false;
        }

        return true;
    },

    _isDateValid(date) {
        if (!this._isDateBetween(date, 'day')) {
            return false;
        }

        if (this._disabledDays && this._disabledDays.includes(date.getDay())) {
            return false;
        }

        if (this._disabledDates && this._disabledDates.find(disabledDate => disabledDate.isSame(date, 'day'))) {
            return false;
        }

        if (this._enabledDates && !this._enabledDates.find(enabledDate => enabledDate.isSame(date, 'day'))) {
            return false;
        }

        if (this._disabledTimeIntervals) {
            const startOfDay = date.clone().startOf('day');
            const endOfDay = date.clone().endOf('day');

            if (this._disabledTimeIntervals.find(([start, end]) => endOfDay.isSameOrAfter(start) && startOfDay.isSameOrBefore(end))) {
                return false;
            }
        }

        return true;
    },

    _isTimeValid(date) {
        if (!this._isDateBetween(date, 'second')) {
            return false;
        }

        if (this._disabledHours && this._disabledHours.includes(date.getHour())) {
            return false;
        }

        if (this._disabledDays && this._disabledDays.includes(date.getDay())) {
            return false;
        }

        if (this._disabledDates && this._disabledDates.find(disabledDate => disabledDate.isSame(date, 'day'))) {
            return false;
        }

        if (this._enabledDates && !this._enabledDates.find(enabledDate => enabledDate.isSame(date, 'day'))) {
            return false;
        }

        if (this._disabledTimeIntervals && this._disabledTimeIntervals.find(([start, end]) => date.isSameOrAfter(start) && date.isSameOrBefore(end))) {
            return false;
        }

        return true;
    },

    _parseDate(date) {
        if (!date) {
            return date;
        }

        if (date instanceof DateTime) {
            return DateTime.fromTimestamp(
                date.getTimestamp(),
                this._dateOptions
            );
        }

        if (Core.isString(date)) {
            try {
                return DateTime.fromFormat(
                    this._settings.format,
                    date,
                    this._dateOptions
                );
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

    _parseDates(dates) {
        if (!dates) {
            return null;
        }

        return dates
            .map(date => this._parseDate(date))
            .filter(date => !!date);
    }

});
