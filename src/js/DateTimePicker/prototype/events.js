/**
 * DateTimePicker Events
 */

Object.assign(DateTimePicker.prototype, {

    /**
     * Attach events for the DateTimePicker.
     */
    _events() {
        if (!this._autoInit) {
            dom.addEvent(this._node, 'focus.frost.datetimepicker', _ => {
                this.show();
            });
        }

        dom.addEvent(this._node, 'blur.frost.datetimepicker', _ => {
            const value = dom.getValue(this._node);
            if (this._settings.multiDate) {
                const values = value.split(this._settings.multiDateSeparator);
                const dates = [];
                let error = false;
                for (const val of values) {
                    try {
                        const date = this._makeDate(val);
                        if (date.isValid && this._isValid(date, 'second')) {
                            dates.push(date);
                        } else {
                            error = true;
                        }
                    } catch (e) {
                        error = true;
                    }

                    if (error) {
                        break;
                    }
                }
                if (!error) {
                    this._setDates(dates);
                } else if (!this._settings.keepInvalid) {
                    this._setDates(this._dates);
                }
            } else {
                try {
                    const date = this._makeDate(value);
                    if (date.isValid && this._isValid(date, 'second')) {
                        this._setDate(date);
                    } else if (!this._settings.keepInvalid) {
                        this._setDate(this._date);
                    }
                } catch (e) {
                    if (!this._settings.keepInvalid) {
                        this._setDate(this._date);
                    }
                }
            }
        });

        if (this._settings.keyDown && !this._settings.inline && !this._settings.multiDate) {
            dom.addEvent(this._node, 'keydown.frost.datetimepicker', e => {
                this._settings.keyDown(e, this);
            });
        }

        dom.addEvent(this._container, 'click.frost.datetimepicker mousedown.frost.datetimepicker', e => {
            e.preventDefault();
            e.stopPropagation();
        });

        dom.addEventDelegate(this._container, 'click.frost.datetimepicker', '[data-action]', e => {
            const element = e.currentTarget;
            const action = dom.getDataset(element, 'action');
            const tempDate = this._date ?
                this._date.clone() :
                this._now();

            switch (action) {
                case 'setDate':
                    tempDate.setYear(
                        dom.getDataset(element, 'year'),
                        dom.getDataset(element, 'month'),
                        dom.getDataset(element, 'date')
                    );

                    this._setDate(tempDate);

                    if (!this._hasTime && !this._settings.keepOpen) {
                        this.hide();
                    }

                    break;
                case 'setDateMulti':
                    tempDate.setYear(
                        dom.getDataset(element, 'year'),
                        dom.getDataset(element, 'month'),
                        dom.getDataset(element, 'date')
                    );

                    if (this._isCurrent(tempDate)) {
                        this._dates = this._dates.filter(date => !date.isSame(tempDate, 'day'));
                    } else {
                        this._dates.push(tempDate);
                    }

                    this._viewDate = tempDate.clone();

                    this._setDates(this._dates);

                    break;
                case 'nextTime':
                case 'prevTime':
                    const timeMethod = action === 'prevTime' ?
                        'sub' :
                        'add';
                    const unit = dom.getDataset(element, 'unit');
                    tempDate[timeMethod](
                        unit === 'minute' ?
                            this._settings.stepping :
                            1,
                        unit
                    );

                    this._setDate(tempDate);

                    break;
                case 'togglePeriod':
                    const currentHours = tempDate.getHours();
                    tempDate.setHours(
                        currentHours + (currentHours < 12 ? 12 : -12)
                    );

                    this._setDate(tempDate);

                    break;
                case 'setHours':
                    tempDate.setHours(
                        dom.getDataset(element, 'hour')
                    );

                    this._timeViewMode = null;

                    this._setDate(tempDate);

                    break;
                case 'setMinutes':
                    tempDate.setMinutes(
                        dom.getDataset(element, 'minute')
                    );

                    this._timeViewMode = null;

                    this._setDate(tempDate);

                    break;
                case 'setSeconds':
                    tempDate.setSeconds(
                        dom.getDataset(element, 'second')
                    );

                    this._timeViewMode = null;

                    this._setDate(tempDate);

                    break;
                case 'changeView':
                    this._viewMode = dom.getDataset(element, 'view');

                    if (dom.hasDataset(element, 'year')) {
                        this._viewDate.setYear(
                            dom.getDataset(element, 'year'),
                            dom.getDataset(element, 'month') || 1,
                            dom.getDataset(element, 'date') || 1
                        );
                    }

                    this._refreshDate();

                    break;
                case 'changeTimeView':
                    this._timeViewMode = dom.getDataset(element, 'timeView');

                    this._refreshTime();

                    break;
                case 'showTime':
                    dom.setStyle(this._timeContainer, 'display', '');
                    dom.squeezeIn(this._timeContainer, {
                        duration: 100
                    });
                    dom.squeezeOut(this._dateContainer, {
                        duration: 100
                    }).then(_ => {
                        dom.setStyle(this._dateContainer, 'display', 'none', true);
                    });
                    break;
                case 'showDate':
                    dom.setStyle(this._dateContainer, 'display', '');
                    dom.squeezeIn(this._dateContainer, {
                        duration: 100
                    });
                    dom.squeezeOut(this._timeContainer, {
                        duration: 100
                    }).then(_ => {
                        dom.setStyle(this._timeContainer, 'display', 'none', true);
                    });
                    break;
                case 'next':
                case 'prev':
                    const dateMethod = action === 'prev' ?
                        'sub' :
                        'add';
                    this._viewDate[dateMethod](
                        dom.getDataset(element, 'amount') || 1,
                        dom.getDataset(element, 'unit')
                    );

                    this._refreshDate();

                    break;
            }
        });
    }

});
