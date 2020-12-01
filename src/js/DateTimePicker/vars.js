// DateTimePicker default options
DateTimePicker.defaults = {
    format: null,
    locale: DateFormatter.defaultLocale,
    timeZone: DateTime.defaultTimeZone,
    defaultDate: null,
    minDate: null,
    maxDate: null,
    enabledDates: null,
    disabledDates: null,
    enabledDays: null,
    disabledDays: null,
    enabledHours: null,
    disabledHours: null,
    disabledTimeIntervals: null,
    multiDate: false,
    multiDateSeparator: ',',
    icons: {
        up: 'icon-arrow-up',
        right: 'icon-arrow-right',
        down: 'icon-arrow-down',
        left: 'icon-arrow-left'
    },
    tooltips: {
        decrementHour: 'Decrement Hour',
        decrementMinute: 'Decrement Minute',
        decrementSecond: 'Decrement Second',
        incrementHour: 'Increment Hour',
        incrementMinute: 'Increment Minute',
        incrementSecond: 'Increment Second',
        nextDecade: 'Next Decade',
        nextMonth: 'Next Month',
        nextYear: 'Next Year',
        prevDecade: 'Previous Decade',
        prevMonth: 'Previous Month',
        prevYear: 'Previous Year',
        selectDate: 'Select Date',
        selectHour: 'Select Hour',
        selectMinute: 'Select Minute',
        selectMonth: 'Select Month',
        selectSecond: 'Select Second',
        selectTime: 'Select Time',
        selectYear: 'Select Year',
        togglePeriod: 'Toggle Period'
    },
    keyDown: (e, dtp) => {
        let date = dtp._date ?
            dtp._date :
            dtp._now();

        switch (e.key) {
            case 'ArrowUp':
                if (e.ctrlKey) {
                    date.sub(1, 'year');
                } else {
                    date.sub(7, 'days');
                }
                break;
            case 'ArrowDown':
                if (e.ctrlKey) {
                    date.add(1, 'year');
                } else {
                    date.add(7, 'days');
                }
                break;
            case 'ArrowRight':
                if (e.ctrlKey) {
                    date.add(1, 'month');
                } else {
                    date.add(1, 'day');
                }
                break;
            case 'ArrowLeft':
                if (e.ctrlKey) {
                    date.sub(1, 'month');
                } else {
                    date.sub(1, 'day');
                }
                break;
            case 'PageUp':
                date.add(1, 'hour');
                break;
            case 'PageDown':
                date.sub(1, 'hour');
                break;
            case 'Home':
                date = dtp._now()
                break;
            case 'Delete':
                date = null;
                break;
            default:
                return;
        }

        e.preventDefault();
        dtp._setDate(date);
    },
    renderDay: null,
    renderHour: null,
    renderMinute: null,
    renderMonth: null,
    renderSecond: null,
    renderYear: null,
    useCurrent: false,
    keepOpen: false,
    focusOnShow: false,
    minView: null,
    inline: false,
    sideBySide: false,
    keepInvalid: false,
    stepping: 1,

    duration: 100,
    placement: 'bottom',
    position: 'start',
    fixed: false,
    spacing: 3,
    minContact: false
};

DateTimePicker._formatTokenRegExp = /([a-z])\1*|'[^']*'/ig;
DateTimePicker._dateTokenRegExp = /[GyYqQMLwWdDFEec]/;
DateTimePicker._hourTokenRegExp = /[hHKk]/;
DateTimePicker._minuteTokenRegExp = /[m]/;
DateTimePicker._secondTokenRegExp = /[s]/;
DateTimePicker._dayPeriods = {};
DateTimePicker._defaultDateFormats = {};
DateTimePicker._defaultFormats = {};

// DateTimePicker QuerySet method
if (QuerySet) {
    QuerySet.prototype.dateTimePicker = function(a, ...args) {
        let settings, method;

        if (Core.isObject(a)) {
            settings = a;
        } else if (Core.isString(a)) {
            method = a;
        }

        for (const node of this) {
            if (!Core.isElement(node)) {
                continue;
            }

            const dateTimePicker = DateTimePicker.init(node, settings);

            if (method) {
                dateTimePicker[method](...args);
            }
        }

        return this;
    };
}

UI.DateTimePicker = DateTimePicker;
