// DateTimePicker events
dom.addEvent(document, 'click.ui.datetimepicker', e => {
    DateTimePicker.autoHide(e.target);
});

dom.addEvent(document, 'keyup.ui.datetimepicker', e => {
    switch (e.key) {
        case 'Tab':
            DateTimePicker.autoHide(e.target);
            break;
        case 'Escape':
            DateTimePicker.autoHide();
            break;
    }
});

dom.addEventDelegate(document, 'click.ui.datetimepicker', '[data-ui-toggle="datetimepicker"]', e => {
    e.preventDefault();

    const target = UI.getTarget(e.currentTarget);
    const datetimepicker = DateTimePicker.init(target, {}, true);
    datetimepicker.toggle(e.currentTarget);
});
