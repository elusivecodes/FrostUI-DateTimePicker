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
    locale: DateTime.defaultLocale,
    timeZone: DateTime.defaultTimeZone,
    defaultDate: null,
    minDate: null,
    maxDate: null,
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
    keyDown(e) {
        let date = this._date ?
            this._date.clone() :
            this._now();

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
                date = this._now()
                break;
            case 'Delete':
                date = null;
                break;
            case 'Enter':
                e.preventDefault();
                return this.toggle();
            case 'Escape':
            case 'Tab':
                return this.hide();
            default:
                return;
        }

        e.preventDefault();

        this.show();

        if (!date || this._isValid(date, 'second')) {
            this._setDate(date);
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
    mobileNative: true,
    minView: null,
    stepping: 1,
    duration: 100,
    appendTo: null,
    placement: 'bottom',
    position: 'start',
    fixed: false,
    spacing: 0,
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
    days: 'text-secondary fw-light',
    disabled: 'datetimepicker-disabled',
    hourColumn: 'col-3 p-1',
    menu: 'datetimepicker',
    menuInline: 'datetimepicker-inline',
    menuShadow: 'shadow-sm',
    menuWide: 'datetimepicker-wide',
    navigation: 'text-primary fs-5 lh-1',
    periodButton: 'btn btn-primary d-block',
    row: 'row g-0',
    rowContainer: 'p-0',
    secondary: 'text-secondary',
    spacingNav: 'py-2',
    spacingSeparator: 'py-2',
    spacingTime: 'py-2 px-0',
    spacingTimeNav: 'py-4 px-0',
    table: 'table table-borderless table-sm text-center mx-0 my-auto',
    time: 'datetimepicker-time',
    timeColumn: 'col-3 px-1 py-2',
    title: 'fw-bold',
    titleWide: 'w-100',
    today: 'datetimepicker-today'
};

// Default icons
DateTimePicker.icons = {
    date: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1" fill="currentColor"/></svg>',
    down: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6l1.41-1.42z" fill="currentColor"/></svg>',
    left: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M15.41 16.58L10.83 12l4.58-4.59L14 6l-6 6l6 6l1.41-1.42z" fill="currentColor"/></svg>',
    right: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.42z" fill="currentColor"/></svg>',
    time: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7h1.5z" fill="currentColor"/></svg>',
    up: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6l-6 6l1.41 1.41z" fill="currentColor"/></svg>'
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
