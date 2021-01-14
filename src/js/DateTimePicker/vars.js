/**
 * @callback DateTimePicker~validCallback
 * @param {DateTime} date The date to test.
 */

/**
 * @callback DateTimePicker~renderCallback
 * @param {DateTime} date The date being rendered.
 * @param {HTMLElement} element The element being rendered.
 */

// DateTimePicker default options
DateTimePicker.defaults = {
    format: null,
    locale: DateFormatter.defaultLocale,
    timeZone: DateTime.defaultTimeZone,
    defaultDate: null,
    minDate: null,
    maxDate: null,
    icons: {
        up: '⮝',
        right: '⮞',
        down: '⮟',
        left: '⮜',
        time: '🕑',
        date: '📅'
    },
    lang: {
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
    isValidDay: null,
    isValidMonth: null,
    isValidTime: null,
    isValidYear: null,
    renderDay: null,
    renderMonth: null,
    renderYear: null,
    keyDown: (e, datetimepicker) => {
        let date = datetimepicker._date ?
            datetimepicker._date.clone() :
            datetimepicker._now();

        switch (e.code) {
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
                date = datetimepicker._now()
                break;
            case 'Delete':
                date = null;
                break;
            case 'Enter':
                e.preventDefault();
                return datetimepicker.toggle();
            case 'Escape':
            case 'Tab':
                return datetimepicker.hide();
            default:
                return;
        }

        e.preventDefault();

        datetimepicker.show();

        if (!date || datetimepicker._isValid(date, 'second')) {
            datetimepicker._setDate(date);
        }
    },
    multiDate: false,
    multiDateSeparator: ',',
    useCurrent: false,
    keepOpen: false,
    showOnFocus: true,
    focusOnShow: true,
    inline: false,
    sideBySide: false,
    keepInvalid: false,
    ignoreReadonly: false,
    minView: null,
    stepping: 1,
    duration: 100,
    appendTo: null,
    placement: 'bottom',
    position: 'start',
    fixed: false,
    spacing: 3,
    minContact: false
};

// Default classes
DateTimePicker.classes = {
    action: 'datetimepicker-action',
    active: 'datetimepicker-active',
    borderless: 'table-borderless',
    column: 'col d-flex flex-column',
    container: 'row row-cols-1 gy-0 gx-2',
    containerColumns: 'row-cols-md-2',
    dateColumn: 'col-4 px-1 py-2',
    disabled: 'datetimepicker-disabled',
    menu: 'datetimepicker',
    menuInline: 'datetimepicker-inline',
    menuShadow: 'shadow-sm',
    menuWide: 'datetimepicker-wide',
    navigation: 'text-primary',
    periodButton: 'btn btn-primary d-block',
    row: 'row g-0',
    rowContainer: 'p-0',
    secondary: 'text-secondary',
    spacingNav: 'py-2',
    spacingSeparator: 'py-2',
    spacingTime: 'py-2 px-0',
    spacingTimeNav: 'py-4 px-0',
    table: 'table table-sm text-center mx-0 my-auto',
    time: 'datetimepicker-time',
    timeColumn: 'col-3 px-1 py-2',
    title: 'fw-bold',
    titleWide: 'w-100',
    today: 'datetimepicker-today'
};

// Format token RegExp
DateTimePicker._formatTokenRegExp = /([a-z])\1*|'[^']*'/ig;

// Cache values
DateTimePicker._dayPeriods = {};
DateTimePicker._defaultDateFormats = {};
DateTimePicker._defaultFormats = {};

DateTimePicker._triggers = new WeakMap();

UI.initComponent('datetimepicker', DateTimePicker);

UI.DateTimePicker = DateTimePicker;
