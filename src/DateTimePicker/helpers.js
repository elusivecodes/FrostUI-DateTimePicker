Object.assign(DateTimePicker.prototype, {

    _events() {
        dom.addEventDelegate([this._dateContainer, this._timeContainer], 'click', '[data-action]', e => {
            const element = e.currentTarget;
            const action = dom.getDataset(element, 'action');

            switch (action) {
                case 'nextTime':
                    this._currentDate.add(
                        1,
                        dom.getDataset(element, 'unit')
                    );

                    this.update();
                    this._renderView();

                    break;
                case 'prevTime':
                    this._currentDate.sub(
                        1,
                        dom.getDataset(element, 'unit')
                    );

                    this.update();
                    this._renderView();

                    break;
                case 'dayPeriod':
                    const currentHours = this._currentDate.getHours();
                    this._currentDate.setHours(
                        currentHours + (currentHours < 12 ? 12 : -12)
                    );

                    this.update();
                    this._renderView();

                    break;
                case 'next':
                    this._viewDate.add(
                        dom.getDataset(element, 'amount') || 1,
                        dom.getDataset(element, 'unit')
                    );

                    this._renderView();

                    break;

                case 'prev':
                    this._viewDate.sub(
                        dom.getDataset(element, 'amount') || 1,
                        dom.getDataset(element, 'unit')
                    );

                    this._renderView();

                    break;

                case 'changeView':
                    this._viewMode = dom.getDataset(element, 'view');

                    if (dom.hasAttribute(element, 'data-year')) {
                        this._viewDate.setYear(
                            dom.getDataset(element, 'year'),
                            dom.getDataset(element, 'month') || 1,
                            dom.getDataset(element, 'date') || 1
                        );
                    }

                    this._renderView();

                    break;

                case 'setDate':
                    this._currentDate.setYear(
                        dom.getDataset(element, 'year'),
                        dom.getDataset(element, 'month'),
                        dom.getDataset(element, 'date')
                    );

                    this._viewDate = this._currentDate.clone();

                    this.update();
                    this._renderView();

                    break;
            }
        });
    },

    _isDateValid(date) {
        if (this._minDate && date.isBefore(this._minDate)) {
            return false;
        }

        if (this._maxDate && date.isAfter(this._maxDate)) {
            return false;
        }

        if (this._disabledDates && this._disabledDates.find(disabledDate => disabledDate.isSame(date, 'day'))) {
            return false;
        }

        if (this._enabledDates && !this._enabledDates.find(enabledDate => enabledDate.isSame(date, 'day'))) {
            return false;
        }

        if (this._disabledDays && this._disabledDays.includes(date.getDay())) {
            return false;
        }

        if (this._enabledDays && !this._enabledDays.includes(date.getDay())) {
            return false;
        }

        return true;
    },

    _isMonthValid(date) {
        if (this._minDate && date.isBefore(this._minDate, 'month')) {
            return false;
        }

        if (this._maxDate && date.isAfter(this._maxDate, 'month')) {
            return false;
        }

        return true;
    },

    _isYearValid(date) {
        if (this._minDate && date.isBefore(this._minDate, 'year')) {
            return false;
        }

        if (this._maxDate && date.isAfter(this._maxDate, 'year')) {
            return false;
        }

        return true;
    },

    _isTimeValid(date) {
        if (!this._isDateValid(date)) {
            return false;
        }

        if (this._disabledHours && this._disabledHours.includes(date.getHour())) {
            return false;
        }

        if (this._enabledHours && !this._enabledHours.includes(date.getHour())) {
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
        return dates
            .map(date => this._parseDate(date))
            .filter(date => !!date);
    }

});
