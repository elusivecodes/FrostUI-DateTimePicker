// DateTimePicker events
dom.addEvent(document, 'click.frost.datetimepicker', e => {
    DateTimePicker.autoHide(e.target);
});

dom.addEvent(document, 'keyup.frost.datetimepicker', e => {
    switch (e.key) {
        case 'Tab':
            DateTimePicker.autoHide(e.target);
        case 'Escape':
            DateTimePicker.autoHide();
    }
});

dom.addEventDelegate(document, 'click.frost.datetimepicker', '[data-toggle="datetimepicker"]', e => {
    e.preventDefault();

    const target = UI.getTarget(e.currentTarget);
    const datetimepicker = DateTimePicker.init(target, {}, true);
    datetimepicker.toggle(e.currentTarget);
});
