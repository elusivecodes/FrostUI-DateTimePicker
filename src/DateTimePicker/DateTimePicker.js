class DateTimePicker {

    constructor(node, settings) {
        this._node = node;

        this._settings = Core.extend(
            {},
            this.constructor.defaults,
            dom.getDataset(this._node),
            settings
        );

        this._useDayPeriod = this.constructor.checkDayPeriod(this._settings.locale);

        if (!this._settings.format) {
            this._settings.format = this._settings.multiDate ?
                this.constructor.getDefaultDateFormat(this._settings.locale, this._useDayPeriod) :
                this.constructor.getDefaultFormat(this._settings.locale, this._useDayPeriod);
        }

        this._checkFormat();

        if (this._settings.multiDate && this._hasTime) {
            throw new Error('Time components cannot be used with multiDate option.');
        }

        if (this._settings.multiDate && !this._hasDate) {
            throw new Error('Date components must be used with multiDate option.');
        }

        this._dateOptions = {
            locale: this._settings.locale,
            timeZone: this._settings.timeZone
        };

        this._currentDate = null;
        this._dates = [];
        this._minDate = null;
        this._maxDate = null;
        this._enabledDates = null;
        this._disabledDates = null;
        this._disabledDays = null;
        this._disabledHours = null;
        this._disabledTimeIntervals = null;
        this._timeViewMode = null;

        switch (this._settings.minView) {
            case 'decade':
                this._viewMode = 'decade';
                break;
            case 'year':
                this._viewMode = 'year';
                break;
            default:
                this._viewMode = 'month';
                break;
        }

        this._now = DateTime.now(this._dateOptions);

        const value = dom.getValue(this._node);
        if (value) {
            this._currentDate = DateTime.fromFormat(this._settings.format, value, this._dateOptions);
        }

        if (!this._currentDate && this._settings.defaultDate) {
            this._currentDate = this._parseDate(this._settings.defaultDate);
        }

        if (!this._currentDate && this._settings.useCurrent) {
            this._currentDate = this._now.clone();
        }

        if (this._settings.multiDate && this._currentDate) {
            this._dates.push(this._currentDate);
            this._currentDate = null;
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

        if (this._settings.disabledDays) {
            this._disabledDays = this._settings.disabledDays;
        }

        if (this._settings.disabledHours) {
            this._disabledHours = this._settings.disabledHours;
        }

        if (this._settings.disabledTimeIntervals) {
            this._disabledTimeIntervals = this._settings.disabledTimeIntervals.map(
                intervals => this._parseDates(intervals)
            ).filter(intervals => intervals.length === 2);
        }

        if (this._settings.viewDate) {
            this._viewDate = this._parseDate(this._settings.viewDate);
        }

        if (!this._settings.viewDate && this._currentDate) {
            this._viewDate = this._currentDate.clone();
        }

        if (!this._settings.viewDate) {
            this._viewDate = this._now.clone();
        }

        this.update();
        this._render();
        this._events();

        dom.setData(this._node, 'datetimepicker', this);
    }

    destroy() {

        dom.removeData(this._node, 'dropdown');
    }

    hide() {
        if (
            this._settings.inline ||
            this._animating ||
            !dom.isConnected(this._menuNode) ||
            !dom.triggerOne(this._node, 'hide.frost.datetimepicker')
        ) {
            return;
        }

        this._animating = true;

        dom.fadeOut(this._menuNode, {
            duration: this._settings.duration
        }).then(_ => {
            dom.detach(this._menuNode);
            dom.setAttribute(this._node, 'aria-expanded', false);
            dom.triggerEvent(this._node, 'hidden.frost.datetimepicker');
        }).catch(_ => { }).finally(_ => {
            this._animating = false;
        });
    }

    show() {
        if (
            this._settings.inline ||
            this._animating ||
            dom.isConnected(this._menuNode) ||
            !dom.triggerOne(this._node, 'show.frost.datetimepicker')
        ) {
            return;
        }

        this._animating = true;
        dom.append(document.body, this._menuNode);
        this._popper.update();

        dom.fadeIn(this._menuNode, {
            duration: this._settings.duration
        }).then(_ => {
            dom.setAttribute(this._node, 'aria-expanded', true);
            dom.triggerEvent(this._node, 'shown.frost.datetimepicker');

            if (this._settings.focusOnShow) {
                dom.focus(this._node);
            }
        }).catch(_ => { }).finally(_ => {
            this._animating = false;
        });
    }

    toggle() {
        dom.hasClass(this._menuNode, 'show') ?
            this.hide() :
            this.show();
    }

    static autoHide(target) {
        const menus = dom.find('.datetimepicker:not(.datetimepicker-inline)');

        for (const menu of menus) {
            const selector = dom.getDataset(menu, 'trigger');
            const trigger = dom.findOne(selector);

            if (trigger === target) {
                continue;
            }

            const datetimepicker = this.init(trigger);
            datetimepicker.hide();
        }
    }

    static init(node, settings) {
        return dom.hasData(node, 'datetimepicker') ?
            dom.getData(node, 'datetimepicker') :
            new this(node, settings);
    }

}
