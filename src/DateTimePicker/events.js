Object.assign(DateTimePicker.prototype, {

    _events() {
        dom.addEvent(this._node, 'focus', _ => {
            this.show();
        });

        dom.addEvent(this._container, 'click', e => {
            e.stopPropagation();
        });

        dom.addEventDelegate(this._container, 'click', '[data-action]', e => {
            const element = e.currentTarget;
            const action = dom.getDataset(element, 'action');
            const hasCurrent = !!this._currentDate;

            switch (action) {
                case 'setDate':
                    if (!hasCurrent) {
                        this._currentDate = this._today.clone();
                    }

                    this._currentDate.setYear(
                        dom.getDataset(element, 'year'),
                        dom.getDataset(element, 'month'),
                        dom.getDataset(element, 'date')
                    );

                    this._viewDate = this._currentDate.clone();

                    this._refreshDate();
                    if (!hasCurrent) {
                        this._refreshTime();
                    }

                    this.update();

                    if (!this._hasTime && !this._settings.keepOpen) {
                        this.hide();
                    }

                    break;
                case 'nextTime':
                case 'prevTime':
                    if (!this._currentDate) {
                        this._currentDate = this._today.clone();
                    }

                    const timeMethod = action === 'prevTime' ?
                        'sub' :
                        'add';
                    const oldDay = this._currentDate.getDay();
                    this._currentDate[timeMethod](
                        1,
                        dom.getDataset(element, 'unit')
                    );

                    if (!hasCurrent || oldDay !== this._currentDate.getDay()) {
                        this._refreshDate();
                    }
                    this._refreshTime();

                    this.update();

                    break;
                case 'dayPeriod':
                    if (!this._currentDate) {
                        this._currentDate = this._today.clone();
                    }

                    const currentHours = this._currentDate.getHours();
                    this._currentDate.setHours(
                        currentHours + (currentHours < 12 ? 12 : -12)
                    );

                    if (!hasCurrent) {
                        this._refreshDate();
                    }
                    this._refreshTime();

                    this.update();

                    break;
                case 'setHours':
                    if (!this._currentDate) {
                        this._currentDate = this._today.clone();
                    }

                    this._currentDate.setHours(
                        dom.getDataset(element, 'hour')
                    );

                    this._timeViewMode = null;

                    if (!hasCurrent) {
                        this._refreshDate();
                    }
                    this._refreshTime();

                    this.update();

                    break;
                case 'setMinutes':
                    if (!this._currentDate) {
                        this._currentDate = this._today.clone();
                    }

                    this._currentDate.setMinutes(
                        dom.getDataset(element, 'minute')
                    );

                    this._timeViewMode = null;

                    if (!hasCurrent) {
                        this._refreshDate();
                    }
                    this._refreshTime();

                    this.update();

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

dom.addEvent(document, 'click.frost.datetimepicker', e => {
    DateTimePicker.autoHide(e.target);
});

dom.addEvent(document, 'keyup.frost.datetimepicker', e => {
    switch (e.key) {
        case 'Tab':
            DateTimePicker.autoHide(e.target, true);
        case 'Escape':
            DateTimePicker.autoHide();
    }
});
