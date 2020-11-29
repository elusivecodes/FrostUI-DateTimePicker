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
            this._settings.format = this.constructor.getDefaultFormat(this._settings.locale, this._useDayPeriod);
        }

        this._checkFormat();

        this._dateOptions = {
            locale: this._settings.locale,
            timeZone: this._settings.timeZone
        };

        this._today = DateTime.now(this._dateOptions);

        const value = dom.getValue(this._node);
        if (value) {
            this._currentDate = DateTime.fromFormat(this._settings.format, value, this._dateOptions);
        } else if (this._settings.defaultDate) {
            this._currentDate = this._parseDate(this._settings.defaultDate);
        } else if (this._settings.useCurrent) {
            this._currentDate = this._today.clone();
        }

        if (this._settings.viewDate) {
            this._viewDate = this._parseDate(this._settings.viewDate);
        } else {
            this._viewDate = this._today.clone();
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

        this._timeViewMode = null;

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
            this._animating ||
            !dom.hasClass(this._menuNode, 'show') ||
            !dom.triggerOne(this._node, 'hide.frost.datetimepicker')
        ) {
            return;
        }

        this._animating = true;

        dom.fadeOut(this._menuNode, {
            duration: this._settings.duration
        }).then(_ => {
            dom.removeClass(this._menuNode, 'show');
            dom.setAttribute(this._node, 'aria-expanded', false);
            dom.triggerEvent(this._node, 'hidden.frost.datetimepicker');
        }).catch(_ => { }).finally(_ => {
            this._animating = false;
        });
    }

    show() {
        if (
            this._animating ||
            dom.hasClass(this._menuNode, 'show') ||
            !dom.triggerOne(this._node, 'show.frost.datetimepicker')
        ) {
            return;
        }

        this._animating = true;
        dom.addClass(this._menuNode, 'show');

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
        const menus = dom.find('.datetimepicker.show');

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
