/**
 * DateTimePicker Events
 */

Object.assign(DateTimePicker.prototype, {

    /**
     * Attach events for the DateTimePicker.
     */
    _events() {
        dom.addEvent(this._menuNode, 'contextmenu.ui.datetimepicker', e => {
            // prevent menu node from showing right click menu
            e.preventDefault();
        });

        const showTime = _ => {
            dom.setStyle(this._timeContainer, 'display', '');
            dom.squeezeIn(this._timeContainer, {
                duration: 100
            });
            dom.squeezeOut(this._dateContainer, {
                duration: 100
            }).then(_ => {
                dom.setStyle(this._dateContainer, 'display', 'none', true);
                this.update();
            });
        };

        dom.addEventDelegate(this._menuNode, 'click.ui.datetimepicker', '[data-ui-action]', e => {
            if (e.button) {
                return;
            }

            const element = e.currentTarget;
            const action = dom.getDataset(element, 'uiAction');
            const tempDate = this._date ?
                this._date.clone() :
                this._now();

            switch (action) {
                case 'setDate':
                    tempDate.setYear(
                        dom.getDataset(element, 'uiYear'),
                        dom.getDataset(element, 'uiMonth'),
                        dom.getDataset(element, 'uiDate')
                    );

                    this._setDate(tempDate);

                    if (this._settings.inline) {
                        return;
                    }

                    if (this._hasTime) {
                        showTime();
                    } else if (!this._settings.keepOpen) {
                        this.hide();
                    }

                    break;
                case 'setDateMulti':
                    tempDate.setYear(
                        dom.getDataset(element, 'uiYear'),
                        dom.getDataset(element, 'uiMonth'),
                        dom.getDataset(element, 'uiDate')
                    );

                    let dates;
                    if (this._isCurrent(tempDate, 'day')) {
                        dates = this._dates.filter(date => !this.constructor._isSameDay(date, tempDate));
                    } else {
                        dates = this._dates.concat([tempDate])
                            .sort((a, b) => this.constructor._isBeforeSecond(a, b) ? -1 : 1);
                    }

                    this._viewDate = tempDate.clone();

                    this._setDates(dates);

                    break;
                case 'nextTime':
                case 'prevTime':
                    const timeMethod = action === 'prevTime' ?
                        'sub' :
                        'add';
                    const unit = dom.getDataset(element, 'uiUnit');
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
                        dom.getDataset(element, 'uiHour')
                    );

                    this._timeViewMode = null;

                    this._setDate(tempDate);

                    break;
                case 'setMinutes':
                    tempDate.setMinutes(
                        dom.getDataset(element, 'uiMinute')
                    );

                    this._timeViewMode = null;

                    this._setDate(tempDate);

                    break;
                case 'setSeconds':
                    tempDate.setSeconds(
                        dom.getDataset(element, 'uiSecond')
                    );

                    this._timeViewMode = null;

                    this._setDate(tempDate);

                    break;
                case 'changeView':
                    this._viewMode = dom.getDataset(element, 'uiView');

                    if (dom.hasDataset(element, 'uiYear')) {
                        this._viewDate.setYear(
                            dom.getDataset(element, 'uiYear'),
                            dom.getDataset(element, 'uiMonth') || 1,
                            dom.getDataset(element, 'uiDate') || 1
                        );
                    }

                    this._refreshDate();

                    break;
                case 'changeTimeView':
                    this._timeViewMode = dom.getDataset(element, 'uiTimeView');

                    this._refreshTime();

                    break;
                case 'showTime':
                    showTime();
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
                        this.update();
                    });
                    break;
                case 'next':
                case 'prev':
                    const dateMethod = action === 'prev' ?
                        'sub' :
                        'add';
                    this._viewDate[dateMethod](
                        dom.getDataset(element, 'uiAmount') || 1,
                        dom.getDataset(element, 'uiUnit')
                    );

                    this._refreshDate();

                    break;
            }
        });

        dom.addEvent(this._node, 'change.ui.datetimepicker', _ => {
            if (this._noChange) {
                return;
            }

            const value = dom.getValue(this._node);
            if (this._settings.multiDate) {
                const values = value.split(this._settings.multiDateSeparator).filter(val => !!val);
                const dates = [];
                for (const val of values) {
                    const date = this._makeDate(val);
                    if (date && date.isValid && this._isValid(date, 'second')) {
                        dates.push(date);
                    }
                }
                if (dates.length === values.length) {
                    this._setDates(dates);
                } else if (!this._settings.keepInvalid) {
                    this._setDates(this._dates);
                }
            } else if (value) {
                const date = this._makeDate(value);
                if (date && date.isValid && this._isValid(date, 'second')) {
                    this._setDate(date);
                } else if (!this._settings.keepInvalid) {
                    this._setDate(this._date);
                }
            } else {
                this._setDate(null);
            }
        });

        if (this._settings.inline) {
            return;
        }

        dom.addEvent(this._menuNode, 'click.ui.datetimepicker', e => {
            // prevent menu node from closing modal
            e.stopPropagation();
        });

        dom.addEvent(this._menuNode, 'mousedown.ui.datetimepicker', e => {
            // prevent menu node from triggering blur event
            e.preventDefault();
        });

        dom.addEvent(this._node, 'focus.ui.datetimepicker', _ => {
            if (!dom.isSame(this._node, document.activeElement)) {
                return;
            }

            dom.stop(this._menuNode);
            this._animating = false;

            this.show();
        });

        dom.addEvent(this._node, 'blur.ui.datetimepicker', _ => {
            if (dom.isSame(this._node, document.activeElement)) {
                return;
            }

            dom.stop(this._menuNode);
            this._animating = false;

            this.hide();
        });

        if (!this._settings.multiDate) {
            const keyDown = this._settings.keyDown.bind(this);
            dom.addEvent(this._node, 'keydown.ui.datetimepicker', keyDown);

            const keyUp = this._settings.keyUp.bind(this);
            dom.addEvent(this._node, 'keyup.ui.datetimepicker', keyUp);
        }
    }

});
