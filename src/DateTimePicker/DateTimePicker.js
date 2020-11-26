class DateTimePicker {

    constructor(node, settings) {
        this._node = node;

        this._settings = Core.extend(
            {},
            this.constructor.defaults,
            dom.getDataset(this._node),
            settings
        );

        this._hasDayPeriod = this.constructor.checkDayPeriod(this._settings.locale);

        if (!this._settings.format) {
            this._settings.format = this.constructor.getDefaultFormat(this._settings.locale, this._hasDayPeriod);
        }

        this._dateOptions = {
            locale: this._settings.locale,
            timeZone: this._settings.timeZone
        };

        if (this._settings.date) {
            this._currentDate = this._parseDate(this._settings.date);
        } else {
            const value = dom.getValue(this._node);
            this._currentDate = this._parseDate(value);
        }

        if (!this._currentDate) {
            this._currentDate = DateTime.now(this._dateOptions);
        }

        if (this._settings.viewDate) {
            this._viewDate = this._parseDate(this._settings.viewDate);
        } else if (this._currentDate) {
            this._viewDate = this._currentDate.clone();
        }

        if (this._settings.minDate) {
            this._minDate = this._parseDate(this._settings.minDate);
        }

        if (this._settings.maxDate) {
            this._maxDate = this._parseDate(this._settings.maxDate);
        }

        if (this._settings.enabledDates) {
            this._enabledDates = this._parseDates(this._settings.enabledDates);
        } else if (this._settings.disabledDates) {
            this._disabledDates = this._parseDates(this._settings.disabledDates);
        }

        if (this._settings.enabledDays) {
            this._enabledDays = this._settings.enabledDays;
        } else if (this._settings.disabledDays) {
            this._disabledDays = this._settings.disabledDays;
        }

        if (this._settings.enabledHours) {
            this._enabledHours = this._settings.enabledHours;
        } else if (this._settings.disabledHours) {
            this._disabledHours = this._settings.disabledHours;
        }

        this._today = DateTime.now(this._dateOptions);

        this._viewMode = 'month';

        this.update();
        this._render();
        this._events();

        dom.setData(this._node, 'DateTimePicker', this);
    }

    destroy() {

    }

    hide() {

    }

    show() {

    }

    toggle() {

    }

}
